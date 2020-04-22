import { Common } from "./Common.js";
import { router } from "./router.js";
import { Breadcrumbs } from "./breadcrumbs.js";
import { baseComponent } from "./baseComponent.js";
import { Initialize } from "./initialize.js";
import { ERROR } from "./logging.js";
import { BIND } from "./BIND.js";
//* ================== PROPERTIES (get set for each view) ==================

export let Config = {
  "name": "",
	"version": "",
	"environment": "",
	"description": "",
	"baseView": "",
	"appWrapper": "",
	"systemTheme": "",
  "systemStyles": [],
  "interfaces": [],
  "store": false,
  "routes": [],
  "FrameworkVersion": "2.1.1",
};

let Emitted_Data = {};

export let registeredComponents = [];

export let registeredLibraries = [];

export const Component = baseComponent;

export let State = {
  model: {},
  Get(propName="", payload) {},
  Commit(name="", payload) {},
  Dispatch(name="", payload, callback=()=>{}) {}
};

//* ================== METHODS ==================

export const Emit = (eventName="", payload=true) => {

  Emitted_Data = payload;
  let event = new Event(eventName);
  document.dispatchEvent(event);

};

export const Accept = (eventName="") => {

  document.addEventListener(eventName, () => { return Emitted_Data; });

};

export const saveToCache = (key="", payload={}) => {
  let objToCache = {};
  objToCache[key] = payload;  
  localStorage.setItem("quantumDB", JSON.stringify(objToCache));
  let quantumCache = JSON.parse(localStorage.getItem("quantumDB"));
  return quantumCache;
};

export const getFromCache = (key="") => {
  let quantumCache = JSON.parse(localStorage.getItem("quantumDB"));
  if (quantumCache[key] != undefined) {      
    return quantumCache[key];
  }
  else {
    ERROR.NEW("Failed to get Cache", `Quantum was unable to retrieve ${key} from your storage. Please make sure it is set before trying to get it.`, 'getCache', false, true, false);
  }
};

export const createApp = (configuration={}, Created=() => {}) => Initialize.Start(configuration, Created);

export const newController = (View_Name="", Controller={props: [], Data() {}, Init() {}, observers: {}, methods: {}}) => Common.buildVM(View_Name, Controller)
              .then((VM) => {
                
                //* LOGGING
                if (ActiveJS.Config.debugOptions.DOM_MINIPULATION) {
                  DEBUG.NEW("SYSTEM", "Starting the DOM minipulations", VM);
                }

                //? check for binding Reflect
                BIND.Reflect(VM);        

                //? check for binding Bind
                BIND.Bind(VM);

                //? check for binding For
                BIND.For(VM);

                //? check for binding If
                BIND.If(VM);

                //? check for binding on
                BIND.On(VM);

                //* check for inline route attr
                router.getInlineRoutes();

                //* display any errors that occured
                ERROR.RENDER();

                if (ActiveJS.Config.debugOptions.TIME_TO_RENDER) {
                  console.timeEnd();
                }
                
              }).catch((err) => console.error(err));

export const reqisterComponent = (reference="", component={}) => {
  let exists = false;
  let componentTO = {ref: reference, component: component};
  
  registeredComponents.forEach(comp => {

    if (comp.ref == reference) {
      exists = true;
    }

  });

  if (exists == false) {
    registeredComponents.push(componentTO);
  }
};

export const use = (key="", library=false) => {
  
  if (key == "") {
    return ERROR.NEW("System failed to add your library to ActiveJS", "Please make sure that you pass a key for the library to be stored under", "ActiveJS", false, true, false);
  }

  if (library == false) {
    return ERROR.NEW("System failed to add your library to ActiveJS", "Please make sure that you pass a library to be stored under", "ActiveJS", false, true, false);
  }

  registeredLibraries.push({
    key,
    library
  });

};

//* ================== CLASSES ==================

export const Router = {
  navBack: () => router.navBack(),
  removeLastCrumb: () => Breadcrumbs.REMOVE_LAST(),
  route: (path="", params=null) => router.Search(path, params),
  addCrumb: (crumb={path: "", params: null}) => Breadcrumbs.ADD_CRUMB(crumb),
};