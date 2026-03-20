using Microsoft.AspNetCore.Mvc;

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
    [Permission("create_article_category")]
>>>>>>> Stashed changes
    [HttpPost]
    public async Task<IActionResult> Create(CreateArticleCategoryDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

<<<<<<< Updated upstream
=======
    [Permission("update_article_category")]
>>>>>>> Stashed changes
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateArticleCategoryDto dto)
    {
        var ok = await _service.UpdateAsync(id, dto);
        if (!ok) return NotFound();
        return NoContent();
    }

<<<<<<< Updated upstream
=======
    [Permission("delete_article_category")]
>>>>>>> Stashed changes
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}