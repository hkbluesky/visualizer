module.exports = function(grunt) {

  var modulesFinal;

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    

    uglify: {

        dynamic_mappings: {
        
          files: [
            {
              expand: true,     // Enable dynamic expansion.
              cwd: './src/forms/',      // Src matches are relative to this path.
              src: ['*.js'], // Actual pattern(s) to match.
              dest: './build/forms/',   // Destination path prefix.
              ext: '.js',   // Dest filepaths will have this extension.
            },

            {
              expand: true,     // Enable dynamic expansion.
              cwd: './src/forms/',      // Src matches are relative to this path.
              src: ['**'], // Actual pattern(s) to match.
              dest: './build/forms/',   // Destination path prefix.
              ext: '.js',   // Dest filepaths will have this extension.
            }
        ]
      }
    },

    copy: {

      buildLib: {
        
        files: [ {
            expand: true,
            cwd: './src/components/',
            src: [
              './d3/d3.min.js',
              './fancytree/src/jquery.fancytree.*.js',
              './fancytree/src/skin-lion/ui.fancytree.css',
              './jqgrid/js/*.js',
              './jqgrid/css/*.css',
              './jquery/jquery.min.js',
              './jquery-ui/ui/minified/jquery-ui.min.js',
              './three.js/build/three.min.js',
              './ace/lib/ace/**',
              './ckeditor/skins/**',
              './ckeditor/ckeditor.js',
              './ckeditor/adapters/jquery.js',
              './ckeditor/lang/en.js',
              './ckeditor/plugins/**',
              './farbtastic/src/farbtastic.js',
              './jit/Jit/jit.js',
              './jquery.threedubmedia/event.drag/jquery.event.drag.js',
              './sprintf/src/sprintf.min.js',
              './requirejs/require.js',
              './jquery-throttle-debounce/jquery.ba-throttle-debounce.min.js',
              './Aristo-jQuery-UI-Theme/css/Aristo/images/*',
              './Aristo-jQuery-UI-Theme/css/Aristo/*.css'
            ],

            dest: './build/components/'

          },

          {
            expand: true,
            cwd: './src/lib/',
            src: [ './chemdoodle/**' ],
            dest: './build/lib/'
          },

          {
            expand: true,
            cwd: './src/components/',
            src: [
              './Aristo-jQuery-UI-Theme/css/Aristo/images/*',
              './Aristo-jQuery-UI-Theme/css/Aristo/*.css'
            ],
            dest: './build/components/jqueryui/'
          }
        ]
      },

      build: {

        files: [
          {
            expand: true,
            cwd: './src/',
            src: ['./index.html', 'init.js', 'css/**', 'bin/**', 'lib/**', 'src/**', 'data/**'],
            dest: './build/'
          }
        ]
      },

      buildUsr: {

        files: [{
          expand: true,
          cwd: './src/usr/filters/',
          src: '**',
          filter: function( filePath ) {
            var files = grunt.option('filterFiles');
//console.log( files , files.length);
            for( var i = 0, l = files.length ; i < l ; i ++ ) {
              
              if( path.relative( 'src/usr/filters/' + files[ i ], filePath) == "" ) {
                return true;
              }
            }

            return false;
            
          },
          dest: './build/filters/'
        }]
      },

      buildModules: {

        files: [{
          expand: true,
          cwd: './src/',
          src: ['./usr/modules/**', './modules/**' ],
          dest: './build/',
          filter: function(filepath) {

            for( var i in modulesFinal ) {

              if( filepath.indexOf( i ) > -1 )
                return true;
            }
            return false;
          }
        }, 

        {
          expand: true,
          cwd: './src/',
          src: ['./modules/module.js', './modules/modulefactory.js', './default/**', './modules/default/**' ],
          dest: './build/',
        }

        ]
      }
    },

    replace: {
      build: grunt.file.readJSON('./replacements.json')
    },

    clean: {

      build: {
        src: [ 'build' ]
      },

      modules: {
         src : [ "build/modules/**/.DS_Store" ]
      },

      modulesJson: {
        src: [ "build/modules/**/*.json" ],
        filter: function(filepath) {
          return ( ! filepath.match("/lib/") && ! filepath.match(/folder\.json$/) );
        }
      },

      modulesJsonErase: {
         src: [ "src/modules/**/*.json" ],
         filter: function(filepath) {
           return ( ! filepath.match("/lib/") );
         }
      }
    },

    requirejs: {
        
        compile: {
          options: {
            "dir": "./build_optimized/",
            "appDir": "./build/",
            "baseUrl": "./",
            "optimizeCss": "none",
            "optimize": "none",
            "removeCombined": true,
            "paths": {
              "jquery": "empty:",
              "require": "empty:"
            },
            "modules": [
              { 
                name: 'test'
              }
            ]
          }
        }
      }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-text-replace');

  var fs = require('fs');
  var path = require('path');


  grunt.registerTask( 'build', 'Build project', function() {

    if( ! fs.existsSync('./build/') ) {
      fs.mkdirSync( './build/');
    }

    var config = grunt.option('config') || './src/usr/config/default.json';

    if( ! fs.existsSync( config ) ) {
      console.log( 'File config (' + config + ') does not exist');
      return;
    }


    var cfg = grunt.file.readJSON( config ),
        file,
        modules = {},
        jsonStructure = {};

    function loadFile( fileName ) {
  
      var file,
          j = 0,
          i = 0,
          l,
          jsonStructure = { modules: [], folders: {} };

      if( ! require('fs').existsSync( fileName ) ) {
        console.log( 'Folder file ' + fileName + ' does not exist');
        return;
      }

      console.log( 'Fetching file ' + fileName);
      file = grunt.file.readJSON( fileName );

      for( var k in file.folders ) {
        jsonStructure.folders[ k ] = loadFile( './src/' + file.folders[ k ] + 'folder.json');
      }

      if( file.modules ) {
         
        for( j = 0, l = file.modules.length ; j < l ; j ++ ) {
          modules[ file.modules[ j ].url ] = true;
          jsonStructure.modules.push( file.modules[ j ] );
        }
      }

      return jsonStructure;
    }

    for( var i in cfg.modules ) {
      jsonStructure[ i ] = ( loadFile( './src/' + cfg.modules[ i ] ) );
    }

    /* Find filter files from the config.json and puts them in an option */
    var filterFiles = [];
    for( var i in cfg.filters ) {
      filterFiles.push( cfg.filters[i].file );
    }
    grunt.option('filterFiles', filterFiles);
    /* */

    modulesFinal = modules;
    
    //fs.writeFileSync( './build/modules.json', JSON.stringify( jsonStructure, false, '\t' ) );
    cfg.modules = jsonStructure;//'./modules.json';
    fs.writeFileSync( './build/default.json', JSON.stringify( cfg, false, '\t' ) );

    grunt.task.run('copy:buildModules');
    grunt.task.run('copy:buildUsr');
    grunt.task.run('copy:build');
    grunt.task.run('copy:buildLib');


  });
/*
  [
      'clean:build',
      'copy:build',
      'copy:buildLib',
      'copy:buildUsr',
      'buildModules',
      'replace:build'
  ]);
*/

  grunt.registerTask( 'buildModules', 
    [ 
      'createJSONModules',
      'copy:buildModules',
      'clean:modules',
      'clean:modulesJson'
    ]
  );


grunt.registerTask( 'require', ['requirejs']);
  // Takes care of module jsons
  grunt.registerTask( 'eraseModuleJsons', [ 'clean:modulesJsonErase' ] );
  grunt.registerTask( 'createJSONModules', 'Create all modules json', function() {

    
    
    function recurseFolder( basePath, relPath ) {

      var folders = fs.readdirSync( basePath ),
          allFolders = [],
          allModules = [],
          containsModule = false,
          target = {},
          subFolder;

      for( var i = 0, l = folders.length ; i < l ; i ++ ) {
        if( ! fs.statSync( basePath + "/" + folders[ i ] ).isDirectory( ) || folders[ i ] == 'lib') {
            continue;
        }

        if( fs.existsSync(basePath + "/" + folders[ i ] + '/model.js') ) {
          allModules.push( folders[ i ] );  
        } else {
          allFolders.push( folders[ i ] );  
        }
        
        containsModule = containsModule || fs.existsSync(basePath + "/" + folders[ i ] + '/model.js');
      }

      if( allFolders.length == 0 && allModules.length == 0 ) {
        return;
      }


      target.modules = [];
      for( var i = 0, l = allModules.length ; i < l ; i ++ ) {
        var el = /moduleName(?:[: ]*)(?:'|")([a-zA-Z0-9 _-]*)(?:'|")/.exec( grunt.file.read( basePath + "/" + allModules[ i ] + "/controller.js" ) );


        target.modules.push({
          "moduleName": (el[ 1 ] || allModules[ i ]),
          "url": ( relPath ) + "/" + allModules[ i ] + "/"
        });
      }

      target.folders = {};
      for( var i = 0, l = allFolders.length ; i < l ; i ++ ) {
        recurseFolder( basePath + "/" + allFolders[ i ], relPath + "/" + allFolders[ i ] );

        if( fs.existsSync( basePath + "/" + allFolders[ i ] + "/folder.json" ) ) {
          subFolder = grunt.file.readJSON( basePath + "/" + allFolders[ i ] + "/folder.json" );
          target.folders[ subFolder.name ] = relPath + "/" + allFolders[ i ] + "/"
        }
      }

      if( fs.existsSync( basePath + '/folder.json') ) {
        var json = grunt.file.readJSON( basePath + '/folder.json' );
        json.folders = target.folders;
        json.modules = target.modules;

        target = json;

      } else {
        target.name = basePath.split('/').pop();
      }

      fs.writeFileSync(basePath + '/folder.json', JSON.stringify( target, null, "\t") );
    }

    recurseFolder( './src/modules/types', 'modules/types' );
    recurseFolder( './src/usr/modules', 'usr/modules' );
  });

};
