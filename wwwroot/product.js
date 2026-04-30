
  document.addEventListener("DOMContentLoaded", function() {
    console.log("dom content loaded");
    fetchProducts();
  });
  document.getElementById("CategoryId").addEventListener("change", (e) => {
    console.log('dcategory changedd');
    document.getElementById('product_rows').dataset['id'] = e.target.value;
    fetchProducts();
  });

  // delegated event listener
document.getElementById('product_rows').addEventListener("click", (e) => {
  p = e.target.parentElement;
  if (p.classList.contains('product')) {
    e.preventDefault()
    if (document.getElementById('User').dataset['customer'].toLowerCase() == "true") {
      document.getElementById('ProductId').innerHTML = p.dataset['id'];
      document.getElementById('ProductName').innerHTML = p.dataset['name'];
      document.getElementById('UnitPrice').innerHTML = Number(p.dataset['price']).toFixed(2);
      display_total();
      const cart = new bootstrap.Modal('#cartModal', {}).show();
    } else {
      // alert("Only signed in customers can add items to the cart");
      toast("Access Denied", "You must be signed in as a customer to access the cart.");
    }
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

// update total when cart quantity is changed
document.getElementById('Quantity').addEventListener("change", (e) => {
  // console.log(e.target.value);
  const total = parseInt(e.target.value) * Number(document.getElementById('UnitPrice').innerHTML);
  document.getElementById('Total').innerHTML = numberWithCommas(total.toFixed(2));
});
// function to display commas in number
const numberWithCommas = x => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  document.getElementById('Discontinued').addEventListener("change", (e) => {
    console.log('discontinued changed');
    fetchProducts();
  });
  async function fetchProducts() {
    const id = document.getElementById('product_rows').dataset['id'];
    const discontinued = document.getElementById('Discontinued').checked ? "" : "/discontinued/false";
    const { data: fetchedProducts } = await axios.get(`../../api/category/${id}/product${discontinued}`);
    // console.log(fetchedProducts);
    let product_rows = "";
    fetchedProducts.map(product => {
        
      const css = product.discontinued ? " discontinued" : "";
      product_rows += 
        `<tr class="product${css}" data-id="${product.productId}">
          <td>${product.productName}</td>
          <td class="text-end">${product.unitPrice.toFixed(2)}</td>
          <td class="text-end">${product.unitsInStock}</td>
        </tr>`;
    });
    document.getElementById('product_rows').innerHTML = product_rows;
    postCartItem(item);
  }

  document.getElementById('addToCart').addEventListener("click", (e) => {
  // hide modal
  const cart = bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
  // use axios post to add item to cart
  item = {
    "id": Number(document.getElementById('ProductId').innerHTML),
    "email": document.getElementById('User').dataset['email'],
    "qty": Number(document.getElementById('Quantity').value)
  }
  console.log(item);
});

async function postCartItem(item) {
    axios.post('../../api/addtocart', item).then(res => {
    toast("Product Added", `${res.data.product.productName} successfully added to cart.`);
  });
}