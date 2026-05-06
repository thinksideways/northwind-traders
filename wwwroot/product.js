document.addEventListener("DOMContentLoaded", function () {
    console.log("dom content loaded");
    fetchProducts();
});

document.getElementById("CategoryId").addEventListener("change", (e) => {
    console.log('category changed');
    document.getElementById('product_rows').dataset['id'] = e.target.value;
    fetchProducts();
});

// delegated event listener for product clicks (add to cart)
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

const toast = (header, message) => {
    document.getElementById('toast_header').innerHTML = header;
    document.getElementById('toast_body').innerHTML = message;
    bootstrap.Toast.getOrCreateInstance(document.getElementById('liveToast')).show();
}

const display_total = () => {
    const total = parseInt(document.getElementById('Quantity').value) * Number(document.getElementById('UnitPrice').innerHTML);
    document.getElementById('Total').innerHTML = numberWithCommas(total.toFixed(2));
}

document.getElementById('Quantity').addEventListener("change", (e) => {
    display_total();
});

const numberWithCommas = x => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

document.getElementById('Discontinued').addEventListener("change", (e) => {
    console.log('discontinued changed');
    fetchProducts();
});

async function fetchProducts() {
    const id = document.getElementById('product_rows').dataset['id'];
    const discontinued = document.getElementById('Discontinued').checked ? "" : "/discontinued/false";
    const { data: fetchedProducts } = await axios.get(`../../api/category/${id}/product${discontinued}`);
    
    const userDiv = document.getElementById('User');
    const isEmployee = userDiv.dataset['employee'] && userDiv.dataset['employee'].toLowerCase() === "true";
    console.log("Is Employee:", isEmployee);
    console.log("User Data Attributes:", userDiv.dataset);

    let product_rows = "";
    fetchedProducts.map(product => {
        const css = product.discontinued ? " discontinued" : "";
        
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
            `<tr class="product${css}" data-id="${product.productId}" data-name="${product.productName}" data-price="${product.unitPrice}">
                <td>${product.productName}</td>
                <td class="text-end">${product.unitPrice.toFixed(2)}</td>
                ${stockDisplay}
            </tr>`;
    });
    document.getElementById('product_rows').innerHTML = product_rows;
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
        }
    } catch (error) {
        console.error(error);
        toast("Error", "Failed to update stock. Ensure you have the required permissions.");
    }
}

document.getElementById('addToCart').addEventListener("click", (e) => {
    const cart = bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
    const item = {
        "id": Number(document.getElementById('ProductId').innerHTML),
        "email": document.getElementById('User').dataset['email'],
        "qty": Number(document.getElementById('Quantity').value)
    };
    postCartItem(item);
});

async function postCartItem(item) {
    try {
        const res = await axios.post('../../api/addtocart', item);
        toast("Product Added", `${res.data.product.productName} successfully added to cart.`);
    } catch (error) {
        console.error(error);
        toast("Error", "Failed to add product to cart.");
    }
}
