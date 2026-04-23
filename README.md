# Northwind Traders - Employee Inventory Management Implementation Plan

This guide breaks down the requirements for implementing employee login and inventory management into actionable steps.

## Requirement Overview
*   **Employee Login:** Restrict inventory management to authenticated employees.
*   **Schema Modification:** Update the database to support employee-specific data or roles.
*   **Inventory Management:** View products with advanced filtering (0 stock, low stock).
*   **Rules:** Only non-discontinued products; flag products at 0 or below re-order points.
*   **Technology:** Use AJAX for a seamless user experience.

---

## Step-by-Step Implementation

### Step 1: Modify Database Schema
To support employee-specific functionality and login, we need to ensure the database can distinguish employees from customers.

1.  **Update Identity Models:**
    *   Open `Models/AppUser.cs`.
    *   (Optional) Add any custom employee properties (e.g., `EmployeeId`).
2.  **Add Employee Role:**
    *   Prepare a data seeding script in `Program.cs` to create an "Employee" role if it doesn't exist.
3.  **Update Product Data:**
    *   Ensure the `Product` model has the necessary fields: `UnitsInStock`, `ReorderLevel`, and `Discontinued` (already present).
4.  **Migration:**
    *   Run `dotnet ef migrations add AddEmployeeSupport`.
    *   Run `dotnet ef database update`.

### Step 2: Implement Employee Authentication
1.  **Secure Controllers:**
    *   Apply `[Authorize(Roles = "Employee")]` to any new inventory management actions in `ProductController` or a new `InventoryController`.
2.  **Login Logic:**
    *   Ensure the `AccountController` handles role-based redirection if necessary.

### Step 3: Create AJAX-powered Inventory API
Enhance `Controllers/APIController.cs` to provide the data needed for the inventory dashboard.

1.  **Add Inventory Endpoint:**
    *   Create a GET method: `api/product/inventory`.
    *   Logic: Filter for `Discontinued == false`.
    *   Return JSON containing `ProductId`, `ProductName`, `UnitsInStock`, and `ReorderLevel`.
2.  **Add Update Endpoint:**
    *   Create a POST or PUT method: `api/product/updateStock`.
    *   Logic: Accept `ProductId` and `NewStockLevel` to update the database via AJAX.

### Step 4: Build the Inventory Management Frontend
1.  **Create View:**
    *   Add `Views/Product/Inventory.cshtml`.
    *   Create a table to display products.
2.  **Implement Filtering Interface:**
    *   Add checkboxes or a dropdown to filter by:
        *   "All Active Products"
        *   "Out of Stock (0 Units)"
        *   "Below Re-order Level"
3.  **Visual Flagging (CSS):**
    *   Create CSS classes in `wwwroot/client.css` to highlight rows (e.g., `.table-danger` for 0 stock, `.table-warning` for low stock).
4.  **AJAX Logic (JavaScript):**
    *   Create a new JS file (e.g., `wwwroot/inventory.js`).
    *   Use `fetch()` or jQuery `$.getJSON` to call your new API endpoints.
    *   Dynamically update the table based on selected filters without refreshing the page.

### Step 5: Validation & Testing
1.  **Auth Test:** Verify that a regular customer *cannot* access the inventory page.
2.  **Logic Test:** Ensure discontinued products are never shown in the inventory list.
3.  **UI Test:** Confirm that products with 0 stock are correctly "flagged" (e.g., red background) and those below re-order points are highlighted (e.g., yellow background).
4.  **AJAX Test:** Update a stock level and ensure the change persists in the database and updates the UI instantly.
