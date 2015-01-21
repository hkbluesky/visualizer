'use strict';

define(['modules/default/defaultcontroller'], function (Default) {

    function Controller() {
    }

    Controller.prototype = $.extend(true, {}, Default);

    Controller.prototype.moduleInformation = {
        name: 'JSMol',
        description: 'Display a JSMol module',
        author: 'Nathanaêl Khodl, Luc Patiny',
        date: '30.12.2013',
        license: 'MIT',
        cssClass: 'jsmol'
    };

    Controller.prototype.references = {
        data: {
            type: ['cif', 'pdb', 'mol3d', 'magres', 'mol2d', 'jme'],
            label: 'A molecule/protein data'
        },
        message: {
            type: ['string'],
            label: 'Messages from jsmol'
        },
        atom: {
            type: ['string'],
            label: 'A string describing the clicked atom'
        }
    };

    Controller.prototype.events = {
        onMessage: {
            label: 'A new message from jsmol arrived',
            refVariable: ['message']
        },
        onAtomClick: {
            label: 'An atom was clicked',
            refVariable: ['atom']
        },
        onAtomHover: {
            label: 'An atom was hovered',
            refVariable: ['atom']
        }
    };

    Controller.prototype.variablesIn = ['data'];

    Controller.prototype.onJSMolScriptReceive = function (a) {
        this.module.view.executeScript(a);
    };

    Controller.prototype.configurationStructure = function (section) {
        return {
            groups: {
                group: {
                    options: {
                        type: 'list'
                    },

                    fields: {
                        script: {
                            type: 'jscode',
                            title: 'After load script'
                        }
                    }
                }
            }
        }
    };

    Controller.prototype.configAliases = {
        script: ['groups', 'group', 0, 'script', 0]
    };

    Controller.prototype.actionsIn = {
        jsmolscript: 'Some JSMol Script received'
    };

    Controller.prototype.onRemove = function () {
        this.module.view.remove(this.module.getId());
    };

    Controller.prototype.onNewMessage = function(message) {
        this.createDataFromEvent('onMessage', 'message', message);
    };

    Controller.prototype.onAtomClick = function(message) {
        this.createDataFromEvent('onAtomClick', 'atom', message);
    };

    Controller.prototype.onAtomHover = function(message) {
        this.createDataFromEvent('onAtomHover', 'atom', message);
    };

    return Controller;

});