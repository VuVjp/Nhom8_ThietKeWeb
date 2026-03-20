using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController : ControllerBase
{
    private readonly IArticleService _service;

    public ArticlesController(IArticleService service)
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

    [Permission("create_article")]
    [HttpPost]
    public async Task<IActionResult> Create(CreateArticleDto dto)
    {
        var ok = await _service.CreateAsync(dto);
        if (!ok) return BadRequest();
        return Ok();
    }

    [Permission("update_article")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateArticleDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        return NoContent();
    }

    [Permission("delete_article")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
    
    [Permission("update_thumbnail")]
    [HttpPost("{id}/thumbnail")]
    public async Task<IActionResult> UpdateThumbnail(int id, UpdateArticleThumbnailDto dto)
    {
        var ok = await _service.UpdateThumbnailAsync(id, dto);
        if (!ok) return NotFound();
        return NoContent();
    }
}