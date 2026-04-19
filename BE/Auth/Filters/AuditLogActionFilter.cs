using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;
using HotelManagement.Data;
using HotelManagement.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

public class AuditLogActionFilter : IAsyncActionFilter
{
    private static readonly HashSet<string> TrackedHttpMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Post,
        HttpMethods.Put,
        HttpMethods.Patch,
        HttpMethods.Delete,
    };

    private static readonly string[] SensitiveKeywords =
    [
        "password",
        "token",
        "secret",
        "login",
        "logout",
        "register",
        "refresh",
        "profile",
        "avatar",
        "credential",
    ];

    private readonly IAuditLogService _auditLogService;
    private readonly AppDbContext _dbContext;

    public AuditLogActionFilter(IAuditLogService auditLogService, AppDbContext dbContext)
    {
        _auditLogService = auditLogService;
        _dbContext = dbContext;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!ShouldTrackRequest(context))
        {
            await next();
            return;
        }

        var httpContext = context.HttpContext;
        var descriptor = context.ActionDescriptor as ControllerActionDescriptor;
        var entityType = descriptor?.ControllerName ?? "Unknown";
        var actionType = ResolveActionType(httpContext.Request.Method);
        var routeRecordId = ResolveRouteRecordId(context.RouteData.Values);
        var payloadRecordId = ResolveRecordIdFromArguments(context.ActionArguments);
        var recordId = routeRecordId ?? (actionType == "CREATE" ? null : payloadRecordId);
        var oldData = await TryCaptureOldDataAsync(context, entityType, actionType, recordId, httpContext.RequestAborted);

        var executed = await next();

        if (!ShouldTrackExecuted(context, executed))
        {
            return;
        }

        try
        {
            var userId = ResolveUserId(httpContext.User);
            var path = httpContext.Request.Path.Value ?? string.Empty;

            var contextData = new Dictionary<string, object?>
            {
                ["ipAddress"] = httpContext.Connection.RemoteIpAddress?.ToString(),
                ["httpMethod"] = httpContext.Request.Method,
                ["path"] = path,
                ["controller"] = descriptor?.ControllerName,
                ["action"] = descriptor?.ActionName,
                ["statusCode"] = ResolveStatusCode(executed),
            };

            var newData = BuildActionArgumentsPayload(context.ActionArguments);

            var dto = new AuditLogCreateDto
            {
                UserId = userId,
                ActionType = actionType,
                EntityType = entityType,
                RecordId = recordId,
                Context = contextData,
                OldData = oldData,
                NewData = newData,
                Message = BuildMessage(actionType, entityType, recordId, oldData, newData),
            };

            await _auditLogService.CreateAuditLogAsync(dto, httpContext.RequestAborted);
        }
        catch
        {
            // Audit logging must not block business requests.
        }
    }

    private static bool ShouldTrackRequest(ActionExecutingContext context)
    {
        var request = context.HttpContext.Request;
        if (!TrackedHttpMethods.Contains(request.Method))
        {
            return false;
        }

        var endpoint = context.HttpContext.GetEndpoint();
        if (endpoint == null)
        {
            return false;
        }

        var metadata = endpoint.Metadata;
        var hasAllowAnonymous = metadata.GetMetadata<IAllowAnonymous>() != null;
        if (hasAllowAnonymous)
        {
            return false;
        }

        var isProtected = metadata.GetOrderedMetadata<IAuthorizeData>().Any();
        if (!isProtected)
        {
            return false;
        }

        var descriptor = context.ActionDescriptor as ControllerActionDescriptor;
        var controllerName = descriptor?.ControllerName ?? string.Empty;
        var actionName = descriptor?.ActionName ?? string.Empty;
        var path = request.Path.Value ?? string.Empty;

        if (controllerName.Equals("AuditLogs", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (ContainsSensitiveKeyword(controllerName) || ContainsSensitiveKeyword(actionName) || ContainsSensitiveKeyword(path))
        {
            return false;
        }

        return true;
    }

    private static bool ShouldTrackExecuted(ActionExecutingContext context, ActionExecutedContext executed)
    {
        if (executed.Exception != null)
        {
            return false;
        }

        return ShouldTrackRequest(context);
    }

    private static bool ContainsSensitiveKeyword(string value)
    {
        foreach (var keyword in SensitiveKeywords)
        {
            if (value.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static int? ResolveUserId(ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return int.TryParse(claim, out var userId) ? userId : null;
    }

    private static int? ResolveRouteRecordId(RouteValueDictionary values)
    {
        foreach (var kvp in values)
        {
            var key = kvp.Key;
            if (!key.EndsWith("id", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (int.TryParse(Convert.ToString(kvp.Value), out var parsed))
            {
                return parsed;
            }
        }

        return null;
    }

    private static int? ResolveRecordIdFromArguments(IDictionary<string, object?> actionArguments)
    {
        foreach (var argument in actionArguments)
        {
            if (argument.Key.Equals("id", StringComparison.OrdinalIgnoreCase)
                && int.TryParse(Convert.ToString(argument.Value), out var parsedId))
            {
                return parsedId;
            }

            if (argument.Value == null)
            {
                continue;
            }

            var idProperty = argument.Value.GetType().GetProperties()
                .FirstOrDefault(property => property.Name.Equals("Id", StringComparison.OrdinalIgnoreCase));

            if (idProperty == null)
            {
                continue;
            }

            var idValue = idProperty.GetValue(argument.Value);
            if (int.TryParse(Convert.ToString(idValue), out parsedId))
            {
                return parsedId;
            }
        }

        return null;
    }

    private async Task<object?> TryCaptureOldDataAsync(ActionExecutingContext context, string controllerName, string actionType, int? recordId, CancellationToken cancellationToken)
    {
        if (actionType != "UPDATE" || !recordId.HasValue)
        {
            return null;
        }

        var entityClrType = ResolveEntityType(controllerName);
        entityClrType ??= ResolveEntityTypeFromRouteKeys(context.RouteData.Values.Keys);
        if (entityClrType == null)
        {
            return null;
        }

        try
        {
            var existingEntity = await _dbContext.FindAsync(entityClrType, [recordId.Value], cancellationToken);
            if (existingEntity == null)
            {
                return null;
            }

            _dbContext.Entry(existingEntity).State = EntityState.Detached;
            return SanitizeValue(existingEntity);
        }
        catch
        {
            return null;
        }
    }

    private Type? ResolveEntityType(string controllerName)
    {
        var candidates = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            controllerName,
            ToSingular(controllerName),
        };

        return _dbContext.Model
            .GetEntityTypes()
            .Select(entityType => entityType.ClrType)
            .FirstOrDefault(clrType => candidates.Contains(clrType.Name));
    }

    private Type? ResolveEntityTypeFromRouteKeys(IEnumerable<string> routeKeys)
    {
        var candidateNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var key in routeKeys)
        {
            if (!key.EndsWith("id", StringComparison.OrdinalIgnoreCase) || key.Length <= 2)
            {
                continue;
            }

            var rawName = key[..^2];
            candidateNames.Add(rawName);
            candidateNames.Add(ToPascalCase(rawName));
        }

        if (candidateNames.Count == 0)
        {
            return null;
        }

        return _dbContext.Model
            .GetEntityTypes()
            .Select(entityType => entityType.ClrType)
            .FirstOrDefault(clrType => candidateNames.Contains(clrType.Name));
    }

    private static string ToSingular(string value)
    {
        if (value.EndsWith("ies", StringComparison.OrdinalIgnoreCase) && value.Length > 3)
        {
            return value[..^3] + "y";
        }

        if (value.EndsWith("s", StringComparison.OrdinalIgnoreCase) && value.Length > 1)
        {
            return value[..^1];
        }

        return value;
    }

    private static string ToPascalCase(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        return char.ToUpperInvariant(value[0]) + value[1..];
    }

    private static string ResolveActionType(string method)
    {
        return method.ToUpperInvariant() switch
        {
            "POST" => "CREATE",
            "PUT" => "UPDATE",
            "PATCH" => "UPDATE",
            "DELETE" => "DELETE",
            _ => "OTHER",
        };
    }

    private static int ResolveStatusCode(ActionExecutedContext executed)
    {
        if (executed.Result is ObjectResult objectResult)
        {
            return objectResult.StatusCode ?? StatusCodes.Status200OK;
        }

        if (executed.Result is StatusCodeResult statusCodeResult)
        {
            return statusCodeResult.StatusCode;
        }

        return StatusCodes.Status200OK;
    }

    private static string BuildMessage(string actionType, string entityType, int? recordId, object? oldData, object? newData)
    {
        var displayEntity = HumanizeEntityName(entityType);

        if (actionType == "UPDATE")
        {
            var specificMessage = BuildUpdateMessage(entityType, recordId, oldData, newData);
            if (!string.IsNullOrWhiteSpace(specificMessage))
            {
                return specificMessage;
            }
        }

        if (recordId.HasValue)
        {
            return $"{actionType} operation on {displayEntity} #{recordId.Value}.";
        }

        return $"{actionType} operation on {displayEntity}.";
    }

    private static string? BuildUpdateMessage(string entityType, int? recordId, object? oldData, object? newData)
    {
        var oldValues = FlattenJsonValues(ToJsonNode(oldData));
        var updateValues = FlattenUpdateValues(newData);

        if (updateValues.Count == 0)
        {
            return null;
        }

        var displayEntity = HumanizeEntityName(entityType);
        var recordLabel = ResolveRecordLabel(oldValues, recordId);
        var changedFields = new List<string>();

        foreach (var entry in updateValues)
        {
            if (!TryGetCaseInsensitive(oldValues, entry.Key, out var oldValue))
            {
                continue;
            }

            if (JsonValueEquals(oldValue, entry.Value))
            {
                continue;
            }

            var displayField = HumanizeFieldName(entry.Key);
            changedFields.Add($"{displayField} ({FormatFieldValue(entry.Key, oldValue)} -> {FormatFieldValue(entry.Key, entry.Value)})");
        }

        if (changedFields.Count == 0)
        {
            var payloadFields = BuildPayloadSummary(updateValues);
            if (payloadFields.Count == 0)
            {
                return null;
            }

            return $"{displayEntity} {recordLabel} updated: {string.Join(", ", payloadFields.Take(8))}";
        }

        return $"{displayEntity} {recordLabel} changed: {string.Join(", ", changedFields.Take(8))}";
    }

    private static string HumanizeEntityName(string entityType)
    {
        var singular = ToSingular(entityType);
        return HumanizeToken(singular);
    }

    private static string ResolveRecordLabel(Dictionary<string, object?> oldValues, int? recordId)
    {
        if (TryGetCaseInsensitive(oldValues, "RoomNumber", out var roomNumberValue) && roomNumberValue != null)
        {
            return $"#{FormatValue(ToJsonNode(roomNumberValue))}";
        }

        if (TryGetCaseInsensitive(oldValues, "Name", out var nameValue) && nameValue != null)
        {
            return $"\"{FormatValue(ToJsonNode(nameValue))}\"";
        }

        if (recordId.HasValue)
        {
            return $"#{recordId.Value}";
        }

        return string.Empty;
    }

    private static string HumanizeFieldName(string fieldName)
    {
        return fieldName.ToLowerInvariant() switch
        {
            "code" => "Voucher Code",
            "discounttype" => "Discount Type",
            "discountvalue" => "Discount Value",
            "minbookingvalue" => "Min Booking Value",
            "validfrom" => "Valid From",
            "validto" => "Valid To",
            "usagelimit" => "Usage Limit",
            "isactive" => "Status",
            "roomnumber" => "Room",
            "roomtypeid" => "Room Type",
            "cleaningstatus" => "Cleaning Status",
            "phonenumber" => "Phone Number",
            _ => HumanizeToken(fieldName),
        };
    }

    private static List<string> BuildPayloadSummary(Dictionary<string, object?> updateValues)
    {
        var summary = new List<string>();

        foreach (var entry in updateValues)
        {
            var displayField = HumanizeFieldName(entry.Key);
            var valueText = FormatFieldValue(entry.Key, entry.Value);
            summary.Add($"{displayField} set to {valueText}");
        }

        return summary;
    }

    private static string HumanizeToken(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        var withSpaces = System.Text.RegularExpressions.Regex
            .Replace(value, "([a-z0-9])([A-Z])", "$1 $2")
            .Replace("_", " ")
            .Trim();

        return string.Join(' ', withSpaces
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(word => char.ToUpperInvariant(word[0]) + word[1..].ToLowerInvariant()));
    }

    private static Dictionary<string, object?> FlattenUpdateValues(object? newData)
    {
        var root = ToJsonNode(newData);
        if (root == null)
        {
            return new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        }

        var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

        FlattenNode(root, result, string.Empty, includeWrapper: true, ignoreNullValues: true);
        return result;
    }

    private static Dictionary<string, object?> FlattenJsonValues(JsonNode? node)
    {
        var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        FlattenNode(node, result, string.Empty, includeWrapper: true, ignoreNullValues: false);
        return result;
    }

    private static JsonNode? ToJsonNode(object? value)
    {
        if (value == null)
        {
            return null;
        }

        if (value is JsonNode node)
        {

            return node;
        }

        return JsonSerializer.SerializeToNode(value);
    }

    private static void FlattenNode(JsonNode? node, IDictionary<string, object?> result, string prefix, bool includeWrapper, bool ignoreNullValues)
    {
        if (node == null)
        {
            return;
        }

        if (node is JsonObject jsonObject)
        {
            foreach (var kvp in jsonObject)
            {
                var key = kvp.Key;
                var value = kvp.Value;

                if (ShouldIgnoreField(key))
                {
                    continue;
                }

                if (ignoreNullValues && value == null)
                {
                    continue;
                }

                var isWrapper = includeWrapper && IsWrapperKey(key);
                var nextPrefix = string.IsNullOrWhiteSpace(prefix) || isWrapper ? prefix : $"{prefix}.{key}";

                if (value is JsonObject or JsonArray)
                {
                    FlattenNode(value, result, nextPrefix, includeWrapper: false, ignoreNullValues);
                    continue;
                }

                var finalKey = string.IsNullOrWhiteSpace(prefix) || isWrapper ? key : $"{prefix}.{key}";
                result[finalKey] = ToRawValue(value);
            }

            return;
        }

        if (node is JsonArray jsonArray)
        {
            result[prefix] = jsonArray.Select(ToRawValue).ToList();
            return;
        }

        result[prefix] = ToRawValue(node);
    }

    private static bool ShouldIgnoreField(string fieldName)
    {
        return fieldName.EndsWith("id", StringComparison.OrdinalIgnoreCase)
            || ContainsSensitiveKeyword(fieldName);
    }

    private static bool IsWrapperKey(string fieldName)
    {
        return fieldName.Equals("dto", StringComparison.OrdinalIgnoreCase)
            || fieldName.Equals("data", StringComparison.OrdinalIgnoreCase)
            || fieldName.Equals("payload", StringComparison.OrdinalIgnoreCase)
            || fieldName.Equals("model", StringComparison.OrdinalIgnoreCase)
            || fieldName.Equals("request", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryGetCaseInsensitive(Dictionary<string, object?> source, string propertyName, out object? value)
    {
        foreach (var kvp in source)
        {
            if (!kvp.Key.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            value = kvp.Value;
            return true;
        }

        value = null;
        return false;
    }

    private static bool JsonValueEquals(object? left, object? right)
    {
        if (left == null && right == null)
        {
            return true;
        }

        if (left == null || right == null)
        {
            return false;
        }

        var leftNode = ToJsonNode(left);
        var rightNode = ToJsonNode(right);

        if (leftNode == null && rightNode == null)
        {
            return true;
        }

        if (leftNode == null || rightNode == null)
        {
            return false;
        }

        return JsonNode.DeepEquals(leftNode, rightNode);
    }

    private static object? ToRawValue(JsonNode? node)
    {
        if (node is JsonValue jsonValue)
        {
            if (jsonValue.TryGetValue(out string? stringValue))
            {
                return stringValue;
            }

            if (jsonValue.TryGetValue(out int intValue))
            {
                return intValue;
            }

            if (jsonValue.TryGetValue(out long longValue))
            {
                return longValue;
            }

            if (jsonValue.TryGetValue(out decimal decimalValue))
            {
                return decimalValue;
            }

            if (jsonValue.TryGetValue(out bool boolValue))
            {
                return boolValue;
            }
        }

        return node;
    }

    private static string FormatValue(JsonNode? node)
    {
        if (node == null)
        {
            return "null";
        }

        if (node is JsonValue jsonValue)
        {
            if (jsonValue.TryGetValue(out string? stringValue))
            {
                return stringValue ?? "null";
            }

            if (jsonValue.TryGetValue(out bool boolValue))
            {
                return boolValue ? "true" : "false";
            }

            if (jsonValue.TryGetValue(out int intValue))
            {
                return intValue.ToString();
            }

            if (jsonValue.TryGetValue(out long longValue))
            {
                return longValue.ToString();
            }

            if (jsonValue.TryGetValue(out decimal decimalValue))
            {
                return decimalValue.ToString();
            }
        }

        return node.ToJsonString();
    }

    private static string FormatFieldValue(string fieldName, object? value)
    {
        if (fieldName.Equals("isActive", StringComparison.OrdinalIgnoreCase) && value is bool boolValue)
        {
            return boolValue ? "Active" : "Inactive";
        }

        return FormatValue(ToJsonNode(value));
    }

    private static Dictionary<string, object?> BuildActionArgumentsPayload(IDictionary<string, object?> actionArguments)
    {
        var payload = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

        foreach (var argument in actionArguments)
        {
            if (ContainsSensitiveKeyword(argument.Key))
            {
                continue;
            }

            payload[argument.Key] = SanitizeValue(argument.Value);
        }

        return payload;
    }

    private static object? SanitizeValue(object? value)
    {
        if (value == null)
        {
            return null;
        }

        if (value is IFormFile)
        {
            return "[binary content]";
        }

        if (value is string || value.GetType().IsPrimitive || value is decimal || value is DateTime || value is Guid)
        {
            return value;
        }

        JsonNode? node;
        try
        {
            node = JsonSerializer.SerializeToNode(value);
        }
        catch
        {
            return value.ToString();
        }

        ScrubSensitiveNodes(node);
        return node;
    }

    private static void ScrubSensitiveNodes(JsonNode? node)
    {
        if (node is JsonObject jsonObject)
        {
            var keys = jsonObject.Select(kvp => kvp.Key).ToList();
            foreach (var key in keys)
            {
                if (ContainsSensitiveKeyword(key))
                {
                    jsonObject[key] = "[redacted]";
                    continue;
                }

                ScrubSensitiveNodes(jsonObject[key]);
            }

            return;
        }

        if (node is JsonArray jsonArray)
        {
            foreach (var item in jsonArray)
            {
                ScrubSensitiveNodes(item);
            }
        }
    }
}
