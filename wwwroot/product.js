document.addEventListener("DOMContentLoaded", function () {
    console.log("dom content loaded");
    fetchProducts();
});

if (document.getElementById("CategoryId")) {
    document.getElementById("CategoryId").addEventListener("change", (e) => {
        console.log('category changed');
        document.getElementById('product_rows').dataset['id'] = e.target.value;
        fetchProducts();
    });
}

if (document.getElementById("SortBy")) {
    document.getElementById("SortBy").addEventListener("change", (e) => {
        console.log('sort changed');
        fetchProducts();
    });
}

// delegated event listener for product clicks (add to cart)
if (document.getElementById('product_rows')) {
    document.getElementById('product_rows').addEventListener("click", (e) => {
        // If we clicked inside an input or button in the stock cell, don't trigger cart modal
        if (e.target.closest('.stock-input') || e.target.closest('.save-stock') || e.target.closest('.cancel-stock')) {
            return;
        }

        const p = e.target.closest('.product');
        if (p) {
            e.preventDefault();
            if (document.getElementById('User').dataset['customer'].toLowerCase() == "true") {
                document.getElementById('ProductId').innerHTML = p.dataset['id'];
                document.getElementById('ProductName').innerHTML = p.dataset['name'];
                document.getElementById('UnitPrice').innerHTML = Number(p.dataset['price']).toFixed(2);
                display_total();
                new bootstrap.Modal('#cartModal', {}).show();
            } else {
                toast("Access Denied", "You must be signed in as a customer to access the cart.");
            }
        }
    });

    // Delegated listener for stock input changes
    document.getElementById('product_rows').addEventListener("input", (e) => {
        if (e.target.classList.contains('stock-input')) {
            const tr = e.target.closest('tr');
            tr.querySelector('.save-stock').style.display = 'inline-block';
            tr.querySelector('.cancel-stock').style.display = 'inline-block';
        }
    });

    // Delegated listener for save/cancel stock buttons
    document.getElementById('product_rows').addEventListener("click", (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.classList.contains('save-stock')) {
            const id = btn.dataset['id'];
            const tr = btn.closest('tr');
            const qty = tr.querySelector('.stock-input').value;
            updateStock(id, qty, tr);
        } else if (btn.classList.contains('cancel-stock')) {
            fetchProducts(); // Reset the list to original values
        }
    });
}

const toast = (header, message) => {
    document.getElementById('toast_header').innerHTML = header;
    document.getElementById('toast_body').innerHTML = message;
    bootstrap.Toast.getOrCreateInstance(document.getElementById('liveToast')).show();
}

const display_total = () => {
    const total = parseInt(document.getElementById('Quantity').value) * Number(document.getElementById('UnitPrice').innerHTML);
    document.getElementById('Total').innerHTML = numberWithCommas(total.toFixed(2));
}

if (document.getElementById('Quantity')) {
    document.getElementById('Quantity').addEventListener("change", (e) => {
        display_total();
    });
}

const numberWithCommas = x => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

if (document.getElementById('Discontinued')) {
    document.getElementById('Discontinued').addEventListener("change", (e) => {
        console.log('discontinued changed');
        fetchProducts();
    });
}

if (document.getElementById('OutOfStockOnly')) {
    document.getElementById('OutOfStockOnly').addEventListener("change", (e) => {
        console.log('out of stock toggle changed');
        const isChecked = e.target.checked;
        if (isChecked && document.getElementById('Reorder')) {
            document.getElementById('Reorder').checked = false;
        }
        document.getElementById('CategoryId').disabled = isChecked;
        document.getElementById('Discontinued').disabled = isChecked;
        fetchProducts();
    });
}

if (document.getElementById('Reorder')) {
    document.getElementById('Reorder').addEventListener("change", (e) => {
        console.log('reorder toggle changed');
        const isChecked = e.target.checked;
        if (isChecked && document.getElementById('OutOfStockOnly')) {
            document.getElementById('OutOfStockOnly').checked = false;
        }
        document.getElementById('CategoryId').disabled = isChecked;
        document.getElementById('Discontinued').disabled = isChecked;
        fetchProducts();
    });
}

async function fetchProducts() {
    const productRowsEl = document.getElementById('product_rows');
    if (!productRowsEl) return;

    const outOfStockOnlyEl = document.getElementById('OutOfStockOnly');
    const isOutOfStockOnly = outOfStockOnlyEl && outOfStockOnlyEl.checked;

    const reorderEl = document.getElementById('Reorder');
    const isReorder = reorderEl && reorderEl.checked;
    
    const id = productRowsEl.dataset['id'];
    const sortByEl = document.getElementById('SortBy');
    const sort = sortByEl ? sortByEl.value : "ProductName";
    
    let url;
    if (isOutOfStockOnly) {
        url = `../../api/product/out-of-stock?sort=${sort}`;
    } else if (isReorder) {
        url = `../../api/product/reorder?sort=${sort}`;
    } else {
        const discontinuedEl = document.getElementById('Discontinued');
        const discontinued = (discontinuedEl && discontinuedEl.checked) ? "" : "/discontinued/false";
        url = `../../api/category/${id}/product${discontinued}?sort=${sort}`;
    }
    
    try {
        const { data: fetchedProducts } = await axios.get(url);
        
        const userDiv = document.getElementById('User');
        const isEmployee = userDiv.dataset['employee'] && userDiv.dataset['employee'].toLowerCase() === "true";

        let product_rows = "";
        fetchedProducts.map(product => {
            let css = product.discontinued ? " discontinued" : "";
            
            if (isEmployee) {
                if (Number(product.unitsInStock) === 0) {
                    css += " out-of-stock";
                } else if (Number(product.unitsInStock) <= Number(product.reorderLevel)) {
                    css += " low-stock";
                }
            }
            
            let employeeFields = "";
            if (isEmployee) {
                employeeFields = `
                    <td class="text-end">${product.unitsOnOrder}</td>
                    <td class="text-end">${product.reorderLevel}</td>
                `;
            }

            let stockDisplay = `<td class="text-end">${product.unitsInStock}</td>`;
            if (isEmployee) {
                stockDisplay = `
                    <td class="text-end">
                        <div class="input-group input-group-sm justify-content-end">
                            <input type="number" class="form-control form-control-sm border-0 bg-transparent text-end stock-input" 
                                   value="${product.unitsInStock}" data-id="${product.productId}" style="max-width: 80px;">
                            <button class="btn btn-outline-success border-0 save-stock" data-id="${product.productId}" style="display:none;">
                                <i class="bi bi-check-lg"></i>
                            </button>
                            <button class="btn btn-outline-danger border-0 cancel-stock" data-id="${product.productId}" style="display:none;">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </td>`;
            }

            product_rows += 
                `<tr class="product${css}" data-id="${product.productId}" data-name="${product.productName}" data-price="${product.unitPrice}" data-reorder="${product.reorderLevel}">
                    <td>${product.productName}</td>
                    <td class="text-end">${product.unitPrice.toFixed(2)}</td>
                    ${employeeFields}
                    ${stockDisplay}
                </tr>`;
        });
        productRowsEl.innerHTML = product_rows;
    } catch (error) {
        console.error("Failed to fetch products:", error);
    }
}

async function updateStock(id, qty, tr) {
    try {
        const response = await axios.post('../../api/product/updateStock', {
            id: parseInt(id),
            qty: parseInt(qty)
        });
        if (response.status === 200) {
            toast("Stock Updated", `${tr.dataset['name']} stock updated to ${qty}.`);
            tr.querySelector('.save-stock').style.display = 'none';
            tr.querySelector('.cancel-stock').style.display = 'none';
            // Update the input value in case the server did some adjustment (though unlikely here)
            tr.querySelector('.stock-input').value = qty;
            
            const userDiv = document.getElementById('User');
            const isEmployee = userDiv.dataset['employee'] && userDiv.dataset['employee'].toLowerCase() === "true";

            if (isEmployee) {
                const reorderLevel = Number(tr.dataset['reorder']);

                // Toggle stock status classes based on new quantity
                if (Number(qty) === 0) {
                    tr.classList.add('out-of-stock');
                    tr.classList.remove('restocked', 'low-stock');
                } else if (Number(qty) <= reorderLevel) {
                    tr.classList.add('low-stock');
                    tr.classList.remove('out-of-stock', 'restocked');
                } else {
                    tr.classList.remove('out-of-stock', 'low-stock');
                    tr.classList.add('restocked');
                }
            }
        }
    } catch (error) {
        console.error(error);
        toast("Error", "Failed to update stock. Ensure you have the required permissions.");
    }
}

if (document.getElementById('addToCart')) {
    document.getElementById('addToCart').addEventListener("click", (e) => {
        const cart = bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
        const item = {
            "id": Number(document.getElementById('ProductId').innerHTML),
            "email": document.getElementById('User').dataset['email'],
            "qty": Number(document.getElementById('Quantity').value)
        };
        postCartItem(item);
    });
}

async function postCartItem(item) {
    try {
        const res = await axios.post('../../api/addtocart', item);
        toast("Product Added", `${res.data.product.productName} successfully added to cart.`);
    } catch (error) {
        console.error(error);
        toast("Error", "Failed to add product to cart.");
    }
}
