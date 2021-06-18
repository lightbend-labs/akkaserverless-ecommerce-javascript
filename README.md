# Akka Serverless - eCommerce Example App

A JavaScript-based eCommerce example app for [Akka Serverless](https://developer.lightbend.com/docs/akka-serverless/)

Features include:

* Different eventsourced services for `warehouse`, `orders`, `users`, and `cart`
* An overview of how the API and domain are separated in different protobuf files
* Various ways of using the HTTP annotation

## What is this example?

To help you get started with Akka Serverless, we've built some example apps that showcase the capabilities of the platform. This example application mimics a company that uses Akka Serverless as the backend to their eCommerce platform, keeping track of users, orders, and inventory.

## Prerequisites

To build and deploy this example application, you'll need to have:

* An [Akka Serverless account](https://developer.lightbend.com/docs/akka-serverless/getting-started/lightbend-account.html)
* Node.js v14 or higher installed
* The Docker CLI installed

## Build, Deploy, and Test

Currently, there are four services built to support this eCommerce example app:

* [Cart](./cart): This is a shopping cart service
* [Orders](./orders): This service keeps track of the order history of users
* [Users](./users): This service keeps track of all users and has a collection of **orderIDs** to get order details from the orders service
* [Warehouse](./warehouse): This service keeps track of all the inventory

### Build your containers

To build your own containers, execute the below commands:

```bash
## Set your dockerhub username
export DOCKER_REGISTRY=docker.io
export DOCKER_USER=<your dockerhub username>

## Build containers for each of the services
BASE_DIR=`pwd`
for i in orders users warehouse cart; do
  cd $BASE_DIR/$i
  npm install ## run the npm install command
  npm run test ## as a good practice run the unit tests
  docker build . -t $DOCKER_REGISTRY/$DOCKER_USER/$i:2.0.0
done
```

### Deploy your container

To deploy the containers as a service in Akka Serverless, you'll need to:

```bash
## Set your dockerhub username
export DOCKER_REGISTRY=docker.io
export DOCKER_USER=<your dockerhub username>

## Push the containers to a container registry
for i in orders users warehouse cart; do
  docker push $DOCKER_REGISTRY/$DOCKER_USER/$i:2.0.0
done

## Set your Akka Serverless project name
export AKKASLS_PROJECT=<your project>

## Deploy the services to your Akka Serverless project
for i in orders users warehouse cart; do
  akkasls services deploy $i $DOCKER_REGISTRY/$DOCKER_USER/$i:2.0.0 --project $AKKASLS_PROJECT
done
```

### Testing your service

To test your services, you'll first need to expose them on a public URL

```bash
## Set your Akka Serverless project name
export AKKASLS_PROJECT=<your project>

## Expose the services with a public HTTP endpoint
for i in orders users warehouse cart; do
  akkasls services expose $i --enable-cors --project $AKKASLS_PROJECT
done
```

From there, you can use the endpoints with the below cURL commands for each of the operations that the service exposes.

#### Cart

##### Add item to cart

```bash
curl --request POST \
  --url https://<your Akka Serverless endpoint>/cart/1/items/add \
  --header 'Content-Type: application/json' \
  --data '{
  "userId": "1", 
  "productId": "turkey",
  "name": "delicious turkey",
  "quantity": 2
}'
```

##### Remove item from cart

```bash
curl --request POST \
  --url https://<your Akka Serverless endpoint>/cart/1/items/turkey/remove \
  --header 'Content-Type: application/json' \
  --data '{
  "userId": "1", 
  "productId": "turkey"
}'
```

##### Get cart

```bash
curl --request GET \
  --url https://<your Akka Serverless endpoint>/carts/1 \
  --header 'Content-Type: application/json' \
  --data '{
  "userId": "1", 
}'
```

or

```bash
curl --request GET \
  --url https://<your Akka Serverless endpoint>/carts/1/items \
  --header 'Content-Type: application/json' \
  --data '{
  "user_id": "1", 
}'
```

#### Orders

##### Add Order

```bash
curl --request POST \
  --url https://<your Akka Serverless endpoint>/order/1 \
  --header 'Content-Type: application/json' \
  --data '{
  "userID": "1", 
  "orderID": "4557", 
  "items":[
   {
    "productID": "turkey", 
     "quantity": 12, 
    "price": 10.4
   }
  ]
}'
```

##### Get Order Details

```bash
curl --request GET \
  --url https://<your Akka Serverless endpoint>/order/1 \
  --header 'Content-Type: application/json' \
  --data '{
  "userID": "1",
  "orderID": "4557"
}'
```

##### Get All Orders

```bash
curl --request GET \
  --url https://<your Akka Serverless endpoint>/order/1/all
```

#### Users

##### New User

```bash
curl --request POST \
  --url https://<your Akka Serverless endpoint>/user/1 \
  --header 'Content-Type: application/json' \
  --data '{
  "id": "1",
  "name": "retgits",
  "emailAddress": "retgits@example.com",
  "orderID":[]
}'
```

##### Get User Details

```bash
curl --request GET \
  --url https://<your Akka Serverless endpoint>/user/1
```

##### Update User Orders

```bash
curl --request POST \
  --url https://<your Akka Serverless endpoint>/user/1/order \
  --header 'Content-Type: application/json' \
  --data '{
  "id": "1",
  "orderID": "1234"
}'
```

#### Warehouse

##### Receive Product

```bash
curl --request POST \
  --url https://<your Akka Serverless endpoint>/warehouse/5c61f497e5fdadefe84ff9b9 \
  --header 'Content-Type: application/json' \
  --data '{
    "id": "5c61f497e5fdadefe84ff9b9",
    "name": "Yoga Mat",
    "description": "Limited Edition Mat",
    "imageURL": "/static/images/yogamat_square.jpg",
    "price": 62.5,
    "stock": 5,
    "tags": [
        "mat"
    ]
}'
```

##### Get Product Details

```bash
curl --request GET \
  --url https://<your Akka Serverless endpoint>/warehouse/5c61f497e5fdadefe84ff9b9
```

##### Update Stock

```bash
curl --request POST \
  --url https://<your Akka Serverless endpoint>/warehouse/5c61f497e5fdadefe84ff9b9/stock \
  --header 'Content-Type: application/json' \
  --data '{
    "id": "5c61f497e5fdadefe84ff9b9",
    "stock": 10
}'
```

### Testing your services locally

To test your services, you'll need to run the proxy on your own machine and use the containers you've built.

```bash
## Set your dockerhub username
export DOCKER_REGISTRY=docker.io
export DOCKER_USER=<your dockerhub username>
export SERVICE= ## this can be one of orders users warehouse cart 

## Create a docker bridged network
docker network create -d bridge akkasls

## Run your userfunction
docker run -d --name userfunction --hostname userfunction --network akkasls $DOCKER_REGISTRY/$DOCKER_USER/$SERVICE:2.0.0

## Run the proxy
docker run -d --name proxy --network akkasls -p 9000:9000 --env USER_FUNCTION_HOST=userfunction gcr.io/akkaserverless-public/akkaserverless-proxy:latest -Dconfig.resource=dev-mode.conf -Dcloudstate.proxy.protocol-compatibility-check=false
```

To clean it all up, you can run

```bash
docker stop userfunction
docker rm userfunction
docker stop proxy
docker rm proxy
docker network rm akkasls
```

## Contributing

We welcome all contributions! [Pull requests](https://github.com/lightbend-labs/akkaserverless-ecommerce-javascript/pulls) are the preferred way to share your contributions. For major changes, please open [an issue](https://github.com/lightbend-labs/akkaserverless-ecommerce-javascript/issues) first to discuss what you would like to change.

## Support

This project is provided on an as-is basis and is not covered by the Lightbend Support policy.

## License

See the [LICENSE](./LICENSE).
