"use strict";

import * as chai from "chai";
import * as child_process from 'child_process';
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import * as testUtils from "./command.test.utils";
import * as vscode from "vscode";

const expect = chai.expect;
chai.use(sinonChai);

describe("Combined Start Stop Commands Tests", function() {

	let sandbox: sinon.SinonSandbox;
	let executeCommandSpy: sinon.SinonSpy;
	let showInformationMessageSpy: sinon.SinonSpy;
	let createOutputChannelSpy: sinon.SinonSpy;
	let spawnChildProcessSpy: sinon.SinonSpy;
	let port: string;

	before(function() {
		sandbox = sinon.createSandbox();
		executeCommandSpy = sinon.spy(vscode.commands, "executeCommand");
		showInformationMessageSpy = sinon.spy(vscode.window, "showInformationMessage");
		createOutputChannelSpy = sinon.spy(vscode.window, "createOutputChannel");
		spawnChildProcessSpy = sinon.spy(child_process, "spawn");
	});

	after(function() {
		executeCommandSpy.restore();
		showInformationMessageSpy.restore();
		createOutputChannelSpy.restore();
		spawnChildProcessSpy.restore();
		sandbox.restore();
		port =  undefined;
	});

	afterEach(function(done) {
		testUtils.stopAtlasMapInstance(port, showInformationMessageSpy)
			.then( () => {
				executeCommandSpy.resetHistory();
				showInformationMessageSpy.resetHistory();
				createOutputChannelSpy.resetHistory();
				spawnChildProcessSpy.resetHistory();
				sandbox.resetHistory();
				port =  undefined;
				done();
			})
			.catch( (err) => {
				console.error(err);
				done(err);
			});
	});

	it("Test AtlasMap Server Output Channel Reinstantiation", function(done) {
		expect(port).to.be.undefined;
		testUtils.startAtlasMapInstance(showInformationMessageSpy, spawnChildProcessSpy)
			.then( (_port) => {
				expect(executeCommandSpy.withArgs("atlasmap.start").calledOnce, "AtlasMap start command was not issued").to.be.true;
				port = _port;
				expect(port, "Unable to determine used port for AtlasMap server").to.not.be.undefined;
				expect(port, "Port for AtlasMap server seems to be NaN").to.not.be.NaN;
				expect(createOutputChannelSpy.calledOnce);

				testUtils.stopAtlasMapInstance(port, showInformationMessageSpy)
					.then( (result) => {
						expect(result, "Unable to shutdown the AtlasMap instance! Was it running?").to.be.true;
						port =  undefined;

						//  now reset some spies so the test can succeed
						showInformationMessageSpy.resetHistory();
						spawnChildProcessSpy.resetHistory();

						testUtils.startAtlasMapInstance(showInformationMessageSpy, spawnChildProcessSpy)
							.then( (_port) => {
								expect(executeCommandSpy.withArgs("atlasmap.start").calledTwice, "AtlasMap start command was not issued").to.be.true;
								port = _port;
								expect(port, "Unable to determine used port for AtlasMap server").to.not.be.undefined;
								expect(port, "Port for AtlasMap server seems to be NaN").to.not.be.NaN;
								expect(createOutputChannelSpy.calledTwice);
								done();
							})
							.catch( err => {
								console.error(err);
								done(err);
							});	
					})
					.catch( err => {
						console.error(err);
						done(err);
					});
			})
			.catch( err => {
				console.error(err);
				done(err);
			});
	});
});
