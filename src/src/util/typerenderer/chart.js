'use strict';

define(['../util'], function (Util) {

    let Graph;

    async function loadJsgraph() {
        Graph = await Util.require('jsgraph');
    }

    const defaultOptions = {
        close: {
            top: false,
            right: false,
            bottom: false,
            left: false
        }
    };

    const close = {
        top: true,
        right: true,
        bottom: true,
        left: true
    };

    function renderChart(el, options, rootVal, _options) {
       
        el.empty();

        const graph = Graph.fromJSON( options.resurrect(), el.get( 0 ) );
        graph.resize(Math.max(el.width() - 15, 20), Math.max(el.height() - 15, 20));
        graph.draw();

        return el;
    }

    return {
        init: loadJsgraph,
        toscreen: renderChart
    };

});
