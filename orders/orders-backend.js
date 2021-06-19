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
 * This service uses the Value Entity state model in Akka Serverless.
 */
import as from '@lightbend/akkaserverless-javascript-sdk';
const ValueEntity = as.ValueEntity;

/**
 * Create a new Value Entity with parameters
 * * An array of protobuf files where the entity can find message definitions
 * * The fully qualified name of the service that provides this entities interface
 * * The entity type name for all event source entities of this type. This will be prefixed
 *   onto the entityId when storing the events for this entity.
 */
const entity = new ValueEntity(
    ['orders.proto', 'domain.proto'],
    'ecommerce.OrderBackendService',
    'orders',
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
const Order = entity.lookupType(pkg + 'Order');

/**
 * Set a callback to create the initial state. This is what is created if there is no snapshot
 * to load, in other words when the entity is created and nothing else exists for it yet.
 *
 * The userID parameter can be ignored, it's the id of the entity which is automatically 
 * associated with all events and state for this entity.
 */
entity.setInitial(userID => Order.create({
    userID: '',
}));

/**
 * Set a callback to create the behavior given the current state. Since there is no state
 * machine like behavior transitions for this entity, we just return one behavior, but
 * you could return multiple different behaviors depending on the state.
 *
 * This callback will be invoked after each time that an event is handled to get the current
 * behavior for the current state.
 */
entity.commandHandlers = {
    AddOrder: addOrder,
};

/**
 * The commandHandlers respond to requests coming in from the gRPC gateway.
 * They are responsible to make sure events are created that can be handled
 * to update the actual status of the entity.
**/

/**
 * addOrder is the entry point for the API to add a new order to a user. It logs the user
 * and order data and emits an OrderAdded event to add the order into the orderhistory
 * 
 * @param {*} newOrder the order to be added
 * @param {*} orderHistory an empty placeholder
 * @param {*} ctx the Akka Serverless context
 * @returns
 */
function addOrder(newOrder, orderHistory, ctx) {
    console.log(`Adding order ${newOrder.orderID} to the history of user ${newOrder.userID}`)

    const no = Order.create({
        userID: newOrder.userID,
        orderID: newOrder.orderID,
        items: newOrder.items
    });

    ctx.updateState(no)
    return newOrder
}

export default entity;