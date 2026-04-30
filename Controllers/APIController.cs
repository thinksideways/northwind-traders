using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Northwind.Controllers
{
    public class APIController(DataContext db) : Controller
    {
        // this controller depends on the NorthwindRepository
        private readonly DataContext _dataContext = db;

        [HttpGet, Route("api/product")]
        // returns all products
        public IEnumerable<Product> Get() => _dataContext.Products.OrderBy(p => p.ProductName);
        [HttpGet, Route("api/product/{id}")]
        // returns specific product
        public Product Get(int id) => _dataContext.Products.FirstOrDefault(p => p.ProductId == id);
        [HttpGet, Route("api/product/discontinued/{discontinued}")]
        // returns all products where discontinued = true/false
        public IEnumerable<Product> GetDiscontinued(bool discontinued) => _dataContext.Products.Where(p => p.Discontinued == discontinued).OrderBy(p => p.ProductName);
        [HttpGet, Route("api/category/{CategoryId}/product")]
        // returns all products in a specific category
        public IEnumerable<Product> GetByCategory(int CategoryId) => _dataContext.Products.Where(p => p.CategoryId == CategoryId).OrderBy(p => p.ProductName);
        [HttpGet, Route("api/category/{CategoryId}/product/discontinued/{discontinued}")]
        // returns all products in a specific category where discontinued = true/false
        public IEnumerable<Product> GetByCategoryDiscontinued(int CategoryId, bool discontinued) => _dataContext.Products.Where(p => p.CategoryId == CategoryId && p.Discontinued == discontinued).OrderBy(p => p.ProductName);

        [HttpPost, Route("api/addtocart")]
        // adds a row to the cartitem table
        public CartItem Post([FromBody] CartItemJSON cartItem) => _dataContext.AddToCart(cartItem);

        [HttpGet, Route("api/product/inventory"), Authorize(Roles = "inventory-manager")]
        // returns all products that are not discontinued
        public IEnumerable<Product> GetInventory() => _dataContext.Products.Where(p => !p.Discontinued).OrderBy(p => p.ProductName);

        [HttpPost, Route("api/product/updateStock"), Authorize(Roles = "inventory-manager")]
        // updates the units in stock for a product
        public Product UpdateStock([FromBody] InventoryUpdateJSON inventoryUpdate)
        {
            Product product = _dataContext.Products.FirstOrDefault(p => p.ProductId == inventoryUpdate.id);
            if (product != null)
            {
                product.UnitsInStock = inventoryUpdate.qty;
                _dataContext.SaveChanges();
            }
            return product;
        }

        public IEnumerable<Category> GetCategory() => _dataContext.Categories.Include("Products").OrderBy(c => c.CategoryName);
    }
}