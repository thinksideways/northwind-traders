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
        public IEnumerable<Product> Get(string sort = "ProductName") => ApplySort(_dataContext.Products, sort);
        [HttpGet, Route("api/product/{id}")]
        // returns specific product
        public Product Get(int id) => _dataContext.Products.FirstOrDefault(p => p.ProductId == id);
        [HttpGet, Route("api/product/discontinued/{discontinued}")]
        // returns all products where discontinued = true/false
        public IEnumerable<Product> GetDiscontinued(bool discontinued, string sort = "ProductName") => ApplySort(_dataContext.Products.Where(p => p.Discontinued == discontinued), sort);
        [HttpGet, Route("api/category/{CategoryId}/product")]
        // returns all products in a specific category
        public IEnumerable<Product> GetByCategory(int CategoryId, string sort = "ProductName") => ApplySort(_dataContext.Products.Where(p => p.CategoryId == CategoryId), sort);
        [HttpGet, Route("api/category/{CategoryId}/product/discontinued/{discontinued}")]
        // returns all products in a specific category where discontinued = true/false
        public IEnumerable<Product> GetByCategoryDiscontinued(int CategoryId, bool discontinued, string sort = "ProductName") => ApplySort(_dataContext.Products.Where(p => p.CategoryId == CategoryId && p.Discontinued == discontinued), sort);

        [HttpGet, Route("api/product/out-of-stock"), Authorize(Roles = "northwind-employee")]
        // returns all products that are not discontinued and have 0 units in stock
        public IEnumerable<Product> GetOutOfStock(string sort = "ProductName") => ApplySort(_dataContext.Products.Where(p => !p.Discontinued && p.UnitsInStock == 0), sort);

        [HttpGet, Route("api/product/reorder"), Authorize(Roles = "northwind-employee")]
        // returns all products that are not discontinued, below reorder level, and have 0 units on order
        public IEnumerable<Product> GetReorder(string sort = "ProductName") => ApplySort(_dataContext.Products.Where(p => !p.Discontinued && p.UnitsInStock < p.ReorderLevel && p.UnitsOnOrder == 0), sort);

        private IEnumerable<Product> ApplySort(IQueryable<Product> query, string sort)
        {
            return sort switch
            {
                "UnitPrice" => query.OrderBy(p => p.UnitPrice).ToList(),
                "UnitsInStock" => query.OrderBy(p => p.UnitsInStock).ToList(),
                "UnitsOnOrder" => query.OrderBy(p => p.UnitsOnOrder).ToList(),
                "ReorderLevel" => query.OrderBy(p => p.ReorderLevel).ToList(),
                _ => query.OrderBy(p => p.ProductName).ToList(),
            };
        }

        [HttpPost, Route("api/addtocart")]
        // adds a row to the cartitem table
        public CartItem Post([FromBody] CartItemJSON cartItem) => _dataContext.AddToCart(cartItem);

        [HttpGet, Route("api/product/inventory"), Authorize(Roles = "inventory-manager,northwind-employee")]
        // returns all products that are not discontinued
        public IEnumerable<Product> GetInventory() => _dataContext.Products.Where(p => !p.Discontinued).OrderBy(p => p.ProductName);

        [HttpPost, Route("api/product/updateStock"), Authorize(Roles = "inventory-manager,northwind-employee")]
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