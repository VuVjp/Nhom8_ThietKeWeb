using Microsoft.AspNetCore.Authorization;

public class PermissionAttribute : AuthorizeAttribute
{
    public PermissionAttribute(string permission)
    {
        Policy = permission;
    }
}