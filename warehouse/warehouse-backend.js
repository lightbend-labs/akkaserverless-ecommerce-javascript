/**
 * Copyright 2021 Lightbend Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This service uses the EventSourced state model in Akka Serverless.
 */
import as from '@lightbend/akkaserverless-javascript-sdk';
const EventSourcedEntity = as.EventSourcedEntity;

/**
 * Create a new EventSourced entity with parameters
 * * An array of protobuf files where the entity can find message definitions
 * * The fully qualified name of the service that provides this entities interface
 * * The entity type name for all event source entities of this type. This will be prefixed
 *   onto the entityId when storing the events for this entity.
 */
const entity = new EventSourcedEntity(
    ['warehouse.proto', 'domain.proto'],
    'ecommerce.InventoryBackendService',
    'inventory',
    {   
        // A snapshot will be persisted every time this many events are emitted.
        snapshotEvery: 100,
        
        // The directories to include when looking up imported protobuf files.
        includeDirs: ['./'],
        
        // Whether serialization of primitives should be supported when serializing events 
        // and snapshots.
        serializeAllowPrimitives: true,
        
        // Whether serialization should fallback to using JSON if the state can't be serialized 
        // as a protobuf.
        serializeFallbackToJson: true
    }
);

/**
 * The events and state that are stored in Akka Serverless are in Protobuf format. To make it
 * easier to work with, you can load the protobuf types (as happens in the below code). The
 * Protobuf types are needed so that Akka Serverless knowns how to serialize these objects when 
 * they are persisted.
 */
const pkg = 'ecommerce.persistence.';
const ProductReceived = entity.lookupType(pkg + 'ProductReceived');
const StockChanged = entity.lookupType(pkg + 'StockChanged');
const Product = entity.lookupType(pkg + 'Product');

/**
 * Set a callback to create the initial state. This is what is created if there is no snapshot
 * to load, in other words when the entity is created and nothing else exists for it yet.
 *
 * The productID parameter can be ignored, it's the id of the entity which is automatically 
 * associated with all events and state for this entity.
 */
entity.setInitial(productID => Product.create({
    id: '',
    name: '',
    description: '',
    imageURL: '',
    price: 0,
    stock: 0,
    tags: []
}));

/**
 * Set a callback to create the behavior given the current state. Since there is no state
 * machine like behavior transitions for this entity, we just return one behavior, but
 * you could return multiple different behaviors depending on the state.
 *
 * This callback will be invoked after each time that an event is handled to get the current
 * behavior for the current state.
 */
entity.setBehavior(inventory => {
    return {
        commandHandlers: {
            ReceiveProduct: receiveProduct,
            UpdateStock: updateStock,
        },
        eventHandlers: {
            ProductReceived: productReceived,
            StockChanged: stockChanged,
        }
    };
});

/**
 * The commandHandlers respond to requests coming in from the gRPC gateway.
 * They are responsible to make sure events are created that can be handled
 * to update the actual status of the entity.
**/

/**
 * receiveProduct is the entry point for the API to create a new stock keeping unit (SKU)
 * it logs the product to be added to the inventory and emits a ProductReceived event
 * to add the product into the warehouse
 * @param {*} newProduct the product to add to the warehouse
 * @param {*} inventoryItem an empty placeholder
 * @param {*} ctx the Akka Serverless context object
 * @returns 
 */ 
function receiveProduct(newProduct, inventoryItem, ctx) {
    console.log(`Creating a new product entry for ${newProduct.id}...`)

    const pr = ProductReceived.create({
        id: newProduct.id,
        name: newProduct.name,
        description: newProduct.description,
        imageURL: newProduct.imageURL,
        price: newProduct.price,
        stock: newProduct.stock,
        tags: newProduct.tags
    });

    ctx.emit(pr)
    return newProduct    
}

/**
 * updateStock is the entry point for the API to update the stock level of a product and returns
 * the new stock level after emitting an event to actually change the stock level in the entity.
 * 
 * @param {*} request contains the productID and change in stock
 * @param {*} inventoryItem the stock keeping unit (the entity) that contains product details for this request
 * @param {*} ctx the Akka Serverless context
 * @returns
 */
function updateStock(request, inventoryItem, ctx) {
    console.log(`Updating inventory for ${request.id} from ${inventoryItem.stock} to ${inventoryItem.stock + request.stock}`)

    const us = StockChanged.create({
        id: request.id,
        stock: request.stock
    });

    ctx.emit(us)
    
    inventoryItem.stock = inventoryItem.stock + request.stock
    return inventoryItem
}

/** 
 * The eventHandlers respond to events emitted by the commandHandlers and manipulate
 * the actual state of the entities. The return items of these eventHandlers contain
 * the new state that subsequent messages will act on. 
**/

/**
 * productReceived reacts to the ProductReceived events emitted by the receiveProduct
 * function and adds the new product as an inventory item to the warehouse
 * 
 * @param {*} newProduct the product that is added to the warehouse
 * @param {*} inventoryItem the placeholder that will be filled with the new product
 */
function productReceived(newProduct, inventoryItem) {
    console.log(`Adding ${newProduct.id} to the warehouse...`)
    inventoryItem = newProduct
    return inventoryItem
}

/**
 * stockChanged reacts to the StockChanged events emitted by the updateStock function
 * and updates the stock level of the inventory item of the warehouse
 * 
 * @param {*} stockUpdate the new change in stock
 * @param {*} inventoryItem the product for which stock needs to be updated
 */
function stockChanged(stockUpdate, inventoryItem) {
    console.log(`Updating the current stock level of ${inventoryItem.id} to ${inventoryItem.stock + stockUpdate.stock}`)
    inventoryItem.stock = inventoryItem.stock + stockUpdate.stock
    return inventoryItem
}

export default entity;