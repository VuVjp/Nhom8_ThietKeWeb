
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                status = 404,
                message = ex.Message
            });
        }
        catch (UnauthorizedException ex)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                status = 401,
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                status = 400,
                message = ex.Message
            });
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                status = 400,
                message = ex.Message
            });
        }
        catch (ConflictException ex)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                status = 409,
                message = ex.Message
            });
        }
        catch (ForbiddenException ex)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                status = 403,
                message = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                status = 400,
                message = ex.Message
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                status = 401,
                message = ex.Message
            });
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new
            {
                status = 500,
                message = ex.Message ?? "An unexpected error occurred"
            });
        }
    }
}