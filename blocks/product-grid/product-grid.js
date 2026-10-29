import {
  getProducts, art, money, addToCart,
} from '../../scripts/commerce.js';

export default async function decorate(block) {
  const products = await getProducts();
  const list = document.createElement('ul');
  list.className = 'product-grid-list';

  products.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="product-grid-link" href="/product?sku=${encodeURIComponent(p.sku)}">
        <img alt="" width="240" height="240" loading="lazy">
        <h3></h3>
      </a>
      <p class="product-grid-meta"><span class="product-grid-price"></span></p>
      <button type="button" class="poc-button" data-variant="quiet">Add to cart</button>`;
    li.querySelector('img').src = art(p);
    li.querySelector('h3').textContent = p.name;
    li.querySelector('.product-grid-price').textContent = money(p.price);
    const btn = li.querySelector('button');
    btn.setAttribute('aria-label', `Add ${p.name} to cart`);
    btn.addEventListener('click', () => {
      addToCart(p);
      btn.textContent = 'Added';
      setTimeout(() => { btn.textContent = 'Add to cart'; }, 1200);
    });
    list.append(li);
  });
  block.replaceChildren(list);
}
