/* eslint-disable dot-notation */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
import { Lib } from "./lib.js";
import * as ActiveJS from "./ActiveJS.js";
import { PROXY } from "./PROXY.js";
import { DOM } from "./DOM.js";
import { Initialize } from "./initialize.js";
import { ERROR, DEBUG } from "./logging.js";
import { BIND } from "./BIND.js";
import { ANIMATE } from "./animations.js";

export const Common = {

  VM_LOADED: false,

  LoadVM: (VM_URL, VM_ANIMATION = false, VM_NAVBACK = false, PARAMS = null, BACKPAGE = false) => {
    
    return new Promise((resolve, reject) => {

      Lib.getFileContents({ url: VM_URL, type: "document" }, (err, html) => {

        if (err) {
          reject(err);
        }
        else {

          //* get JS
          let JS = html.getElementsByTagName("script")[0].innerHTML;

          //* build up a script
          let newScript = document.createElement("script");
          newScript.type = 'module';
          newScript.id = "CURRENT_VM";

          //* add JS to the script
          let inlineScript = document.createTextNode(JS);

          //* setup the key for this view
          window.$qm["view_key"] = BIND.getRandowString(5);

          //* setup the VM_ANIMATION for this view
          window.$qm["view_animation"] = VM_ANIMATION;

          //* setup the VM_NAVBACK for this view
          window.$qm["view_navBack"] = VM_NAVBACK;

          //* setup the view_backPage for this view
          window.$qm["view_backPage"] = BACKPAGE;

          //* reset bindings
          window.$qm.DOMBindings = [];
          window.$qm.DOMBoundKeys = [];

          //* LOGGING
          if (ActiveJS.Config.debugOptions.VM_LOADED) {
            DEBUG.NEW("SYSTEM", "Gotten the model for the view");
          }

          //* add template to DOM
          Common.prepareTEMPLATE(html)
            .then((DOCUMENT) => {

              //* add the params to the QM object
              window.$qm["params"] = PARAMS;

              window.$qm["READY_DOCUMENT"] = DOCUMENT;

              //* LOGGING
              if (ActiveJS.Config.debugOptions.VIEW_TEMPLATE_LOADED) {
                DEBUG.NEW("SYSTEM", "Prepared the template", {template: html});
              }

              //* check if there was a script there already
              let el = document.getElementById("CURRENT_VM");
              if (el != null) {
                el.remove();
                newScript.appendChild(inlineScript);
                document.body.appendChild(newScript);
              }
              else {
                newScript.appendChild(inlineScript);
                document.body.appendChild(newScript);
              }

              //* LOGGING
              if (ActiveJS.Config.debugOptions.VIEW_TEMPLATE_LOADED) {
                DEBUG.NEW("SYSTEM", "Loaded VM into the window", {script: newScript});
              }

              //* setup the view_backPage for this view
              window.$qm["VM_LOADED"] = resolve;
            })
            .catch((err) => reject(err));

        }

      });

    });

  },

  buildVM: (VM_NAME, VM) => {

    return new Promise((resolve, reject) => {

      //* set on global VM
      const $VM = {
        el: VM.el,
        fileName: VM_NAME,
        $props: {},
        // _Init: VM._Init,
        _Mounted: VM._Mounted,
        _Rendered: VM._Rendered,
        _beforeUpdate: VM._beforeUpdate,
        _Updated: VM._Updated,
        ...VM.Data(),
        ...VM.methods,
        components: (VM.components) ? VM.components : [],
        computed: { ...VM.computed },
        observers: { ...VM.observers },
      };

      //* setup for if you have computed props
      const computed = Object.entries($VM.computed);
      window.$qm["computedMethodKey"] = {
        intialRun: true,
        setupDone: false,
        cbCalled: false,
        methodKeys: [],
        methodsCalled: 0,
        currentMethodName: false,
        computedMethodsLength: computed.length,
      };

      //* LOGGING
      if (ActiveJS.Config.debugOptions.VM_BUILT) {
        DEBUG.NEW("SYSTEM", "VM has been built up", $VM);
      }

      //! DEPRICATED CODE
      // ActiveJS.Config.name = window.$qm.Config.name;
      // ActiveJS.Config.version = window.$qm.Config.version;
      // ActiveJS.Config.environment = window.$qm.Config.environment;
      // ActiveJS.Config.description = window.$qm.Config.description;
      // ActiveJS.Config.baseView = window.$qm.Config.baseView;
      // ActiveJS.Config.appWrapper = window.$qm.Config.appWrapper;
      // ActiveJS.Config.systemTheme = window.$qm.Config.systemTheme;
      // ActiveJS.Config.systemStyles = window.$qm.Config.systemStyles;
      // ActiveJS.Config.interfaces = window.$qm.Config.interfaces;
      // ActiveJS.Config.store = window.$qm.Config.store;
      // ActiveJS.Config.routes = window.$qm.Config.routes;

      //! DEPRICATED CODE
      // ActiveJS.State.model = window.$qm.State.model;
      // ActiveJS.State.Commit = window.$qm.State.Commit;
      // ActiveJS.State.Dispatch = window.$qm.State.Dispatch;
      // ActiveJS.State.Get = window.$qm.State.Get;

      //! DEPRICATED CODE
      // window.$qm.registeredComponents.forEach(comp => ActiveJS.registeredComponents.push(comp));
      

      //* build up the props
      Common.buildProps(VM, $VM).then(($props) => {

        //* LOGGING
        if (ActiveJS.Config.debugOptions.PASSED_PROPS_GENERATED) {
          DEBUG.NEW("SYSTEM", "Props for view were generated", $props);
        }

        //* method to run when computed methods have been setup
        window.$qm["systemEvents"]["computedMethodsSetupDone"] = () => {

          //* tell the PROXY that we are done setting up computed props          
          window.$qm["computedMethodKey"].intialRun = false;

          //* LOGGING
          if (ActiveJS.Config.debugOptions.COMPUTED_PROPS_BUILT) {
            DEBUG.NEW("SYSTEM", "Computed properties have been built", window.$qm["computedMethodKey"]);
          }

          //* call the mounted life cycle method
          if (window.$qm["$scope"]._Mounted) {
            window.$qm["$scope"]._Mounted($props);

            //* LOGGING
            if (ActiveJS.Config.debugOptions.MOUNTED_LIFECYCLE) {
              DEBUG.NEW("SYSTEM", "_Mounted life cycle method has been called", {passedProps: $props});
            }
          }

          DOM.applyUpdatesToElements(window.$qm["READY_DOCUMENT"], window.$qm["$scope"]);

          //* check for binding Reflect
          if (window.$qm["$scope"].components.length > 0) {
            BIND.getComponentsInUse(window.$qm["READY_DOCUMENT"], window.$qm["$scope"], (res) => { console.log("Components Loaded") });
          }
          else {
            //* callback to router
            window.$qm["VM_LOADED"]();
          }

          let wrapper = false;
          let VIEW_WRAPPER = false;
          if (window.$qm["$scope"].hasOwnProperty("el")) {

            wrapper = document.getElementById(window.$qm["$scope"].el.replace("#", ""));
            VIEW_WRAPPER = window.$qm["READY_DOCUMENT"].getElementById("VIEW_PLACEHOLDER");
            VIEW_WRAPPER.id = window.$qm["$scope"].fileName;

          }
          else {
            ERROR.NEW("System Failed During Render", `Property 'el' was not supplied for the view [${window.$qm["$scope"].fileName}]. Please make sure to always pass this property to your View Models`, "render", false, true, false);
          }

          //* start render proccess
          if (wrapper != null) {

            //* LOGGING
            if (ActiveJS.Config.debugOptions.RENDER_BEGIN) {
              DEBUG.NEW("SYSTEM", "Render proccess is about to begin", {mainEl: wrapper});
            }

            //* animation passed
            if (window.$qm["view_animation"] != false && (window.$qm["view_backPage"].viewName != window.$qm["$scope"].fileName)) {

              switch (window.$qm["view_animation"]) {
                case "slideOver":
                  VIEW_WRAPPER.classList = "view-1";
                  break;
                case "pushIn":
                  VIEW_WRAPPER.classList = "view-2";
                  break;

                default:
                  ERROR.NEW("System Failed During Render", "Invalid view animation type passed with route. Please pass a valid animation with your routes you create", "render", false, true, false);
                  break;
              }

              //* add view to the DOM
              wrapper.appendChild(window.$qm["READY_DOCUMENT"].body.firstChild);

              //* start check for animations
              Common.prepareRenderAnimations(window.$qm["view_animation"], window.$qm["view_navBack"], window.$qm["view_backPage"])
                .then(() => {
                  resolve(window.$qm["$scope"]);
                })
                .catch(() => {

                });

            }
            //* no animation
            else {
              
              wrapper.innerHTML = window.$qm["READY_DOCUMENT"].body.innerHTML;

              //* LOGGING
              if (ActiveJS.Config.debugOptions.RENDER_COMPLETE) {
                DEBUG.NEW("SYSTEM", "Render complete", {document_rendered: window.$qm["READY_DOCUMENT"]});
              }

              resolve(window.$qm["$scope"]);

              //* call Rendered life cycle method
              if (window.$qm["$scope"]._Rendered) {
                window.$qm["$scope"]._Rendered();

                //* LOGGING
                if (ActiveJS.Config.debugOptions.RENDER_LIFECYCLE) {
                  DEBUG.NEW("SYSTEM", "_Rendered life cycle method called");
                }          
              }


            }

          }
          else {
            ERROR.NEW("System Failed During Render", "App wrapper supplied in your config options does not exist in the DOM. Please make sure it exists and retry.", "render", false, true, false);
          }
        };

        //* setup proxy on the global VM        
        window.$qm["$scope"] = PROXY.Observe($VM, PROXY.handler, (_property) => {

          //? call the mounted life cycle method
          if (window.$qm["$scope"]._beforeUpdate && window.$qm["computedMethodKey"].intialRun == false) {
            window.$qm["$scope"]._beforeUpdate();
          }

          //? apply DOM updates
          DOM.applyUpdatesToElements(document.body, window.$qm["$scope"], _property);

        });

        //* LOGGING
        if (ActiveJS.Config.debugOptions.VM_IS_OBSERVED) {
          DEBUG.NEW("SYSTEM", "VM successfully added to the observer and is being watched",  window.$qm["$scope"]);
        }

        window["$scope"] = window.$qm["$scope"];

        //* LOGGING
        if (ActiveJS.Config.debugOptions.VM_ACCESSED_UNDER_SCOPE) {
          DEBUG.NEW("SYSTEM", "VM is accessable via the '$scope' variable");
        }

        //* if you have computed props        
        if (computed.length != 0) {          

          //* tell the PROXY that we are running computed props
          computed.forEach((comp, index) => {
            window.$qm["computedMethodKey"].currentMethodName = comp[0];
            
            //* push to setupArr
            window.$qm["computedMethodKey"].methodKeys.push({
              name: comp[0],
              dependencies: []
            });
            
            //* check if the loop is done
            // if (count == computed.length) {
              //   window.$qm["computedMethodKey"].setupDone = true;
              // }
              
              //* define a computed property for reference later on
              window.$qm["computedMethodKey"].methodsCalled++;
              window.$qm["$scope"][comp[0]] = new Promise((resolve, reject) => {
                let responce = $VM.computed[comp[0]].apply(window.$qm["$scope"]);
                if (responce == undefined) {
                  reject(responce);
                  ERROR.NEW("Computed Property Error", `Your computed property resolved to 'undefined'. This may be because you are using asynchronous code within the method. Note you cannot use asynchronous code inside of a computed property`);
                }
                else {
                  resolve(responce);
                }
              });
          });
        }
        else {
          window.$qm["systemEvents"]["computedMethodsSetupDone"]();
        }

      })
        .catch((err) => console.error(err));

    });

  },

  wrapExistingMethods: () => {

    // return new Promise((resolve, reject) => {

    const _push = Array.prototype.push;

    Array.prototype.push = (item) => {
      console.log(this);

      _push.apply(window.$qm["$scope"]);
      debugger;
    };

    // });

  },

  buildProps: (VM, newVM) => {

    return new Promise((resolve, reject) => {

      //* setup props
      if (VM.props != undefined && VM.props.length > 0) {
        VM.props.forEach(prop => {
          if (window.$qm["params"] != null) {

            //* params
            let params = Object.entries(window.$qm["params"]);

            //* if you have passed the right params
            if (params.length == VM.props.length) {

              params.forEach(param => {
                // debugger;
                if (param[0] == prop) {
                  if (param[1] != undefined) {
                    newVM['$props'][prop] = param[1];
                  }
                }

              });

            }
            else {
              ERROR.NEW("Params Miss Match", `${newVM.fileName} Controller expects ${VM.props.length} prop(s). Please make to pass all props to this view: (${VM.props})`);
            }

          }
          else {
            ERROR.NEW("Params Miss Match", `${newVM.fileName} Controller expects ${VM.props.length} prop(s). Please make to pass all props to this view: (${VM.props})`);
          }
        });
      }

      resolve(newVM.$props);

    });

  },

  prepareTEMPLATE: (VIEW) => {

    return new Promise((resolve, reject) => {

      //* get temp and styles
      const VIEW_TEMP = VIEW.getElementsByTagName("template")[0].innerHTML;
      const VIEW_STYLE = VIEW.getElementsByTagName("style")[0];

      let ViewDiv = `<div id="VIEW_PLACEHOLDER" class="view">${VIEW_TEMP}</div>`;


      //* create document
      let parser = new DOMParser();
      let DOCUMENT = parser.parseFromString(ViewDiv, 'text/html');

      if (VIEW_STYLE.attributes["scoped"]) {

        Common.stripSTYLES(VIEW_STYLE.innerHTML, DOCUMENT).then((_STYLE) => {

          //*Add the styles
          let style = document.createElement("style");
          let VIEW_DIV = DOCUMENT.getElementById("VIEW_PLACEHOLDER");
          style.innerHTML = _STYLE;
          VIEW_DIV.prepend(style);

          //* replace all interpolation
          DOM.replaceDirective(DOCUMENT);

          //* get all the interpolation
          DOM.getAllInterpolation(DOCUMENT);


          resolve(DOCUMENT);

        })
          .catch((err) => console.log(err));

      }
      else {
        //*Add the styles
        let style = document.createElement("style");
        let VIEW_DIV = DOCUMENT.getElementById("VIEW_PLACEHOLDER");
        style.innerHTML = VIEW_STYLE.innerHTML;
        VIEW_DIV.prepend(style);

        //* replace all interpolation
        DOM.replaceDirective(DOCUMENT);

        //* get all the interpolation
        DOM.getAllInterpolation(DOCUMENT);


        resolve(DOCUMENT);
      }

    });

  },

  stripSTYLES: (STYLES, VIEW_TEMP) => {

    return new Promise((resolve, reject) => {

      const allStyles = [];
      const attributes = {};
      const foundId = STYLES.replace(/{([^}]*)}/gm, "{}").match(/[#a-zA-Z][a-zA-Z0-9\-\_]+/gmi);
      const foundClass = STYLES.replace(/{([^}]*)}/gm, "{}").match(/[.a-zA-Z][a-zA-Z0-9\-\_]+/gmi);

      //* get valid ids
      if (foundId) {
        foundId.forEach(style => {
          if (((style.indexOf("#") != -1) || (style.indexOf(".") != -1)) && (!allStyles.includes(style))) {
            allStyles.push(style.trim());
          }
        });
      }

      //* get valid classes
      if (foundClass) {
        foundClass.forEach(style => {
          if ((style.indexOf("#") != -1) || (style.indexOf(".") != -1) && (!allStyles.includes(style))) {
            allStyles.push(style.trim());
          }
        });
      }

      //* lists of ids and classes
      let id = [];
      let _class = [];

      //* build up the attributes
      allStyles.forEach(style => {
        if (style.indexOf("#") != -1) {
          id.push(style);

        }

        if (style.indexOf(".") != -1) {
          _class.push(style);
        }
      });

      attributes["id"] = id;
      attributes["class"] = _class;

      Common.replaceAttributesInTemp(VIEW_TEMP, STYLES, attributes).then((_styles) => {

        resolve(_styles);

      })
        .catch((err) => console.log(err));

    });

  },

  replaceAttributesInTemp: (VIEW_TEMP, STYLES, ATTRIBUTES) => {

    return new Promise((resolve, reject) => {
      let newStyle = STYLES;
      //* replace ids
      ATTRIBUTES.id.forEach((attr) => {

        let ele = VIEW_TEMP.getElementById(attr.replace("#", ""));

        if (ele != null) {

          //* replace the id with the id and key
          let rgx = new RegExp(attr, 'g');
          ele.attributes["id"].value = attr.replace("#", "") + "-" + window.$qm["view_key"];
          newStyle = newStyle.replace(rgx, attr + "-" + window.$qm["view_key"]);
          // console.log(newStyle);

        }


      });

      //* replace class
      VIEW_TEMP.body.querySelectorAll("*").forEach((ele) => {

        let newClass = false;

        if (ele.attributes["class"]) newClass = ele.attributes["class"].value;

        ATTRIBUTES.class.forEach((attr) => {

          if (ele.attributes["class"]) {

            let rgx = new RegExp(attr, 'g');
            newClass = newClass.replace(attr.replace(".", ""), attr.replace(".", "") + "-" + window.$qm["view_key"]);
            newStyle = newStyle.replace(rgx, attr + "-" + window.$qm["view_key"]);

          }

        });

        if (newClass != false) ele.setAttribute("class", newClass);

      });

      resolve(newStyle);

    });

  },

  prepareRenderAnimations: (ANIMATION, NAVBACK, BACKPAGE) => {

    return new Promise((resolve, reject) => {

      if (ANIMATION != false || NAVBACK) {

        //* get the view element
        let viewELE = document.getElementById(window.$qm["$scope"].fileName);
        let lastELE = (BACKPAGE.viewName != "") ? document.getElementById(BACKPAGE.viewName) : viewELE;

        //* nav forwards or backwards
        if (NAVBACK) {

          //* choose what animation to use
          switch (BACKPAGE.animation) {
            case ANIMATE.SLIDE_OVER_TYPE:
              ANIMATE.SLIDE_OVER_BACK(BACKPAGE.animation, window.$qm["$scope"], BACKPAGE, lastELE)
                .then(() => {
                  //* have to wait for the animation to finnish
                  resolve();
                })
                .catch(() => {

                });
              break;
            case ANIMATE.PUSH_IN_TYPE:
              ANIMATE.PUSH_IN_BACK(BACKPAGE.animation, window.$qm["$scope"], BACKPAGE, lastELE)
                .then(() => {
                  //* have to wait for the animation to finnish
                  resolve();
                })
                .catch(() => {

                });
              break;

            default:
              break;
          }

        }
        else {

          //* choose what animation to use
          if ("/" + window.$qm["$scope"].fileName != window.$qm["Config"].baseView) {
            switch (ANIMATION) {
              case ANIMATE.SLIDE_OVER_TYPE:
                ANIMATE.SLIDE_OVER(ANIMATION, window.$qm["$scope"], BACKPAGE, { lastELE, viewELE })
                  .then(() => {
                    //* have to wait for the animation to finnish
                    resolve();
                  })
                  .catch(() => {

                  });
                break;
              case ANIMATE.PUSH_IN_TYPE:
                ANIMATE.PUSH_IN(ANIMATION, window.$qm["$scope"], BACKPAGE, { lastELE, viewELE })
                  .then(() => {
                    //* have to wait for the animation to finnish
                    resolve();
                  })
                  .catch(() => {

                  });
                break;

              default:
                break;
            }
          }

        }

      }
      else {
        resolve();
      }

    });

  },

  prepareComputedProperties: (target, prop) => {
    // debugger;
    window.$qm["computedMethodKey"].methodKeys.forEach((method, index) => {
      if (method.name == window.$qm["computedMethodKey"].currentMethodName) {
        window.$qm["computedMethodKey"].methodKeys[index].dependencies.push(prop);
      }
    });

    //* method to run when computed methods are setup
    window.$qm["systemEvents"]["computedPropSetOnVM"] = () => {
      if (window.$qm["computedMethodKey"].cbCalled == false) {
        window.$qm["computedMethodKey"].cbCalled = true;
        window.$qm["systemEvents"]["computedMethodsSetupDone"]();   
      }
    };

  },

};