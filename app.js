import * as dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

const {
  SHOP_URL,
  SHOP_TOKEN,
  STOREFRONT_TOKEN
} = process.env

const graphURL = SHOP_URL +  '/admin/api/2024-07/graphql.json'

const args = process.argv.slice(2)
const nameIndex = args.indexOf('--name')

if (nameIndex === -1 || nameIndex === args.length - 1) {
  console.error('Please provide search input using --name <searchInput>')
  process.exit(1)
}

const searchString = args[nameIndex + 1]

const query = `
  query($queryString: String!) {
    products(first: 10, query: $queryString) {
      edges {
        node {
          title
          id
          variants(first:10) {
            edges {
              node {
                id
                price
                title
              }
            }
          }
        }
      }
    }
  }
`;

async function getProductsByTitle(searchString) {
  const variables = {
    queryString: `title:*${searchString}*`
  }

  const response = await fetch(graphURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOP_TOKEN
    },
    body: JSON.stringify({ query, variables })
  })

  const result = await response.json()

  if (result.errors) {
    console.error(result.errors)
    return []
  }

  const products = result.data.products.edges.map(edge => edge.node)
  return products
}


getProductsByTitle(searchString)
  .then(products => {
    const formattedStrings = [];

    products.forEach(product => {
      product.variants.edges.forEach(variant => {
        const price = parseFloat(variant.node.price);
        formattedStrings.push({
          text: `${product.title} - variant ${variant.node.title} - price $${price}`,
          price: price
        });
      });
    });

    formattedStrings.sort((a, b) => a.price - b.price);

    formattedStrings.forEach(item => console.log(item.text));
  })
  .catch(error => {
    console.error('Error:', error);
  });