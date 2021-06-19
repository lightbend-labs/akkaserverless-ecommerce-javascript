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
 * This service uses the Views state model in Akka Serverless.
 */
import as from '@lightbend/akkaserverless-javascript-sdk';
const View = as.View;

/**
 * Create a new View with parameters
 * * An array of protobuf files where the entity can find message definitions
 * * The fully qualified name of the service that provides this entities interface
 */
const view = new View(
    ['orders.proto', 'domain.proto'],
    'ecommerce.OrderFrontendService',
    {
        viewId: "orders-frontend-view"
    }
);

view.setUpdateHandlers({ 
    ProcessOrderAdded: orderAdded
});

function orderAdded(event, state, context) {
    console.log(`Updating the order history for ${event.userID}`)

    if(state !== undefined && state.orders !== undefined) {
        state.orders.push(event)
    } else {
        state = {
            userID: event.userID,
            orders: new Array(event)
        }
    }

    console.log(JSON.stringify(state))

    return state
}

export default view;