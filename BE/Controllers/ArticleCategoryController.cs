using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ArticleCategoriesController : ControllerBase
{
    private readonly IArticleCategoryService _service;

    public ArticleCategoriesController(IArticleCategoryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var data = await _service.GetByIdAsync(id);
        if (data == null) return NotFound();
        return Ok(data);
    }

    [Permission(PermissionNames.CreateArticleCategory)]
    [HttpPost]
    public async Task<IActionResult> Create(CreateArticleCategoryDto dto)
    {
        var ok = await _service.CreateAsync(dto);
        if (!ok) return BadRequest();
        return Ok();
    }

    [Permission(PermissionNames.UpdateArticleCategory)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateArticleCategoryDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        return NoContent();
    }

    [Permission(PermissionNames.DeleteArticleCategory)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}