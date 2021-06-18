/**
 * Copyright 2021 Lightbend Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import as from '@lightbend/akkaserverless-javascript-sdk';
import entity from './users-backend.js';
import view from './users-view.js';

/**
 * Create a new Akka Serverless server and bind the entity from
 * users.js to it. The server will listen on port 8080 and 
 * bind to all interfaces
 */
const server = new as.AkkaServerless();
server.addComponent(entity);
server.addComponent(view);
server.start({bindAddress:'0.0.0.0', bindPort:'8080'});