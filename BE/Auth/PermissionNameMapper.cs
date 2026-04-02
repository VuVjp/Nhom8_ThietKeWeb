using System.Reflection;

namespace HotelManagement;

public static class PermissionNameMapper
{
    private static readonly HashSet<string> CanonicalPermissions = typeof(PermissionNames)
        .GetFields(BindingFlags.Public | BindingFlags.Static)
        .Where(field => field.FieldType == typeof(string))
        .Select(field => field.GetValue(null) as string)
        .OfType<string>()
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    private static readonly Dictionary<string, string[]> LegacyPermissionMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["MANAGE_USERS"] = [PermissionNames.ManageUser],
            ["CREATE_USERS"] = [PermissionNames.ManageUser],
            ["UPDATE_USERS"] = [PermissionNames.ManageUser],
            ["DELETE_USERS"] = [PermissionNames.ManageUser],
            ["MANAGE_ROLES"] = [PermissionNames.ManageRole],
            ["MANAGE_ROOMS"] =
            [
                PermissionNames.GetAllRooms,
                PermissionNames.CreateRoom,
                PermissionNames.UpdateRoom,
                PermissionNames.DeleteRoom,
                PermissionNames.ChangeRoomStatus,
                PermissionNames.ChangeRoomCleaningStatus,
                PermissionNames.ManageRoomType,
                PermissionNames.GetAllRoomInventory,
                PermissionNames.CreateRoomInventory,
                PermissionNames.UpdateRoomInventory,
                PermissionNames.DeleteRoomInventory,
            ],
            ["MANAGE_EQUIPMENTS"] =
            [
                PermissionNames.CreateAmenity,
                PermissionNames.UpdateAmenity,
                PermissionNames.DeleteAmenity,
            ],
        };

    public static List<string> NormalizeMany(IEnumerable<string> permissions)
    {
        var normalized = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var item in permissions)
        {
            if (string.IsNullOrWhiteSpace(item))
            {
                continue;
            }

            var trimmed = item.Trim();
            if (CanonicalPermissions.Contains(trimmed))
            {
                normalized.Add(trimmed);
                continue;
            }

            if (LegacyPermissionMap.TryGetValue(trimmed, out var mapped))
            {
                foreach (var permission in mapped)
                {
                    normalized.Add(permission);
                }
            }
        }

        return normalized.OrderBy(name => name).ToList();
    }
}
