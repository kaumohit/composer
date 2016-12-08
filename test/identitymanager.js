/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const IdentityManager = require('../lib/identitymanager');
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Resource = require('@ibm/ibm-concerto-common').Resource;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('IdentityManager', () => {

    let mockDataService;
    let mockDataCollection;
    let mockRegistryManager;
    let mockRegistry;
    let identityManager;
    let mockParticipant;

    beforeEach(() => {
        mockDataService = sinon.createStubInstance(DataService);
        mockDataCollection = sinon.createStubInstance(DataCollection);
        mockDataService.getCollection.withArgs('$sysidentities').resolves(mockDataCollection);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Participant', 'org.doge.Doge').resolves(mockRegistry);
        identityManager = new IdentityManager(mockDataService, mockRegistryManager);
        mockParticipant = sinon.createStubInstance(Resource);
        mockParticipant.getIdentifier.returns('DOGE_1');
        mockParticipant.getType.returns('Doge');
        mockParticipant.getNamespace.returns('org.doge');
        mockParticipant.getFullyQualifiedType.returns('org.doge.Doge');
        mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
    });

    describe('#addIdentityMapping', () => {

        it('should add a new mapping for a user ID to a participant specified by a resource', () => {
            // The participant exists.
            mockRegistry.get.withArgs('DOGE_1').resolves(mockParticipant);
            // An existing mapping for this user ID does not exist.
            mockDataCollection.exists.withArgs('dogeid1').resolves(false);
            return identityManager.addIdentityMapping(mockParticipant, 'dogeid1')
                .then(() => {
                    sinon.assert.calledOnce(mockDataCollection.add);
                    sinon.assert.calledWith(mockDataCollection.add, 'dogeid1', {
                        participant: 'org.doge.Doge#DOGE_1'
                    });
                });
        });

        it('should add a new mapping for a user ID to a participant specified by an identifier', () => {
            // The participant exists.
            mockRegistry.get.withArgs('DOGE_1').resolves(mockParticipant);
            // An existing mapping for this user ID does not exist.
            mockDataCollection.exists.withArgs('dogeid1').resolves(false);
            return identityManager.addIdentityMapping('org.doge.Doge#DOGE_1', 'dogeid1')
                .then(() => {
                    sinon.assert.calledOnce(mockDataCollection.add);
                    sinon.assert.calledWith(mockDataCollection.add, 'dogeid1', {
                        participant: 'org.doge.Doge#DOGE_1'
                    });
                });
        });

        it('should throw if the specified participant does not exist', () => {
            // The participant does not exist.
            mockRegistry.get.withArgs('DOGE_1').rejects(new Error('does not exist'));
            // An existing mapping for this user ID does not exist.
            mockDataCollection.exists.withArgs('dogeid1').resolves(false);
            return identityManager.addIdentityMapping('org.doge.Doge#DOGE_1', 'dogeid1')
                .should.be.rejectedWith(/does not exist/);
        });

        it('should throw if the specified user ID is already mapped', () => {
            // The participant exists.
            mockRegistry.get.withArgs('DOGE_1').resolves(mockParticipant);
            // An existing mapping for this user ID does exist.
            mockDataCollection.exists.withArgs('dogeid1').resolves(true);
            return identityManager.addIdentityMapping('org.doge.Doge#DOGE_1', 'dogeid1')
                .should.be.rejectedWith(/Found an existing mapping for user ID/);
        });

    });

    describe('#removeIdentityMapping', () => {

        it('should remove an existing mapping for a user ID to a participant', () => {
            // An existing mapping for this user ID does exist.
            mockDataCollection.exists.withArgs('dogeid1').resolves(true);
            return identityManager.removeIdentityMapping('dogeid1')
                .then(() => {
                    sinon.assert.calledOnce(mockDataCollection.remove);
                    sinon.assert.calledWith(mockDataCollection.remove, 'dogeid1');
                });
        });

        it('should not throw if an existing mapping for a user ID does not exist', () => {
            // An existing mapping for this user ID does not exist.
            mockDataCollection.exists.withArgs('dogeid1').resolves(false);
            return identityManager.removeIdentityMapping('dogeid1');
        });

    });

});
