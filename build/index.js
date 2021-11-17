function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const preserveCamelCase = string => {
  let isLastCharLower = false;
  let isLastCharUpper = false;
  let isLastLastCharUpper = false;

  for (let i = 0; i < string.length; i++) {
    const character = string[i];

    if (isLastCharLower && /[\p{Lu}]/u.test(character)) {
      string = string.slice(0, i) + '-' + string.slice(i);
      isLastCharLower = false;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = true;
      i++;
    } else if (isLastCharUpper && isLastLastCharUpper && /[\p{Ll}]/u.test(character)) {
      string = string.slice(0, i - 1) + '-' + string.slice(i - 1);
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = false;
      isLastCharLower = true;
    } else {
      isLastCharLower = character.toLocaleLowerCase() === character && character.toLocaleUpperCase() !== character;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = character.toLocaleUpperCase() === character && character.toLocaleLowerCase() !== character;
    }
  }

  return string;
};

const camelCase = (input, options) => {
  if (!(typeof input === 'string' || Array.isArray(input))) {
    throw new TypeError('Expected the input to be `string | string[]`');
  }

  options = { ...{
      pascalCase: false
    },
    ...options
  };

  const postProcess = x => options.pascalCase ? x.charAt(0).toLocaleUpperCase() + x.slice(1) : x;

  if (Array.isArray(input)) {
    input = input.map(x => x.trim()).filter(x => x.length).join('-');
  } else {
    input = input.trim();
  }

  if (input.length === 0) {
    return '';
  }

  if (input.length === 1) {
    return options.pascalCase ? input.toLocaleUpperCase() : input.toLocaleLowerCase();
  }

  const hasUpperCase = input !== input.toLocaleLowerCase();

  if (hasUpperCase) {
    input = preserveCamelCase(input);
  }

  input = input.replace(/^[_.\- ]+/, '').toLocaleLowerCase().replace(/[_.\- ]+([\p{Alpha}\p{N}_]|$)/gu, (_, p1) => p1.toLocaleUpperCase()).replace(/\d+([\p{Alpha}\p{N}_]|$)/gu, m => m.toLocaleUpperCase());
  return postProcess(input);
};

var camelcase = camelCase; // TODO: Remove this for the next major release

var _default = camelCase;
camelcase.default = _default;

const camelCache = {};
const camelString = value => {
  const result = camelCache[value];

  if (!result) {
    camelCache[value] = camelcase(value);
    return camelCache[value];
  }

  return result;
};

class ComponentRegistry {
  constructor() {
    _defineProperty(this, "_cbit", 0);

    _defineProperty(this, "_map", {});
  }

  register(clazz) {
    const key = camelString(clazz.name);
    clazz.prototype._ckey = key;
    clazz.prototype._cbit = BigInt(++this._cbit);
    this._map[key] = clazz;
  }

  get(key) {
    return this._map[key];
  }

}

var isMergeableObject = function isMergeableObject(value) {
  return isNonNullObject(value) && !isSpecial(value);
};

function isNonNullObject(value) {
  return !!value && typeof value === 'object';
}

function isSpecial(value) {
  var stringValue = Object.prototype.toString.call(value);
  return stringValue === '[object RegExp]' || stringValue === '[object Date]' || isReactElement(value);
} // see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25


var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
  return value.$$typeof === REACT_ELEMENT_TYPE;
}

function emptyTarget(val) {
  return Array.isArray(val) ? [] : {};
}

function cloneUnlessOtherwiseSpecified(value, options) {
  return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
}

function defaultArrayMerge(target, source, options) {
  return target.concat(source).map(function (element) {
    return cloneUnlessOtherwiseSpecified(element, options);
  });
}

function getMergeFunction(key, options) {
  if (!options.customMerge) {
    return deepmerge;
  }

  var customMerge = options.customMerge(key);
  return typeof customMerge === 'function' ? customMerge : deepmerge;
}

function getEnumerableOwnPropertySymbols(target) {
  return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function (symbol) {
    return target.propertyIsEnumerable(symbol);
  }) : [];
}

function getKeys(target) {
  return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}

function propertyIsOnObject(object, property) {
  try {
    return property in object;
  } catch (_) {
    return false;
  }
} // Protects from prototype poisoning and unexpected merging up the prototype chain.


function propertyIsUnsafe(target, key) {
  return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
  && !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
  && Object.propertyIsEnumerable.call(target, key)); // and also unsafe if they're nonenumerable.
}

function mergeObject(target, source, options) {
  var destination = {};

  if (options.isMergeableObject(target)) {
    getKeys(target).forEach(function (key) {
      destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
    });
  }

  getKeys(source).forEach(function (key) {
    if (propertyIsUnsafe(target, key)) {
      return;
    }

    if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
      destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
    } else {
      destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
    }
  });
  return destination;
}

function deepmerge(target, source, options) {
  options = options || {};
  options.arrayMerge = options.arrayMerge || defaultArrayMerge;
  options.isMergeableObject = options.isMergeableObject || isMergeableObject; // cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
  // implementations can use it. The caller may not replace it.

  options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
  var sourceIsArray = Array.isArray(source);
  var targetIsArray = Array.isArray(target);
  var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

  if (!sourceAndTargetTypesMatch) {
    return cloneUnlessOtherwiseSpecified(source, options);
  } else if (sourceIsArray) {
    return options.arrayMerge(target, source, options);
  } else {
    return mergeObject(target, source, options);
  }
}

deepmerge.all = function deepmergeAll(array, options) {
  if (!Array.isArray(array)) {
    throw new Error('first argument should be an array');
  }

  return array.reduce(function (prev, next) {
    return deepmerge(prev, next, options);
  }, {});
};

var deepmerge_1 = deepmerge;
var cjs = deepmerge_1;

class PrefabComponent {
  constructor(clazz, properties = {}, overwrite = true) {
    this.clazz = clazz;
    this.properties = properties;
    this.overwrite = overwrite;
  }

  applyToEntity(entity, initialProps = {}) {
    if (!this.clazz.allowMultiple && entity.has(this.clazz)) {
      if (!this.overwrite) {
        return;
      }

      const comp = entity[this.clazz.prototype._ckey];
      entity.remove(comp);
    }

    const props = cjs(this.properties, initialProps);
    entity.add(this.clazz, props);
  }

}

class Prefab {
  constructor(name) {
    _defineProperty(this, "name", '');

    _defineProperty(this, "inherit", []);

    _defineProperty(this, "components", []);

    this.name = name;
  }

  addComponent(prefabComponent) {
    this.components.push(prefabComponent);
  }

  applyToEntity(entity, prefabProps = {}) {
    this.inherit.forEach(parent => {
      parent.applyToEntity(entity, prefabProps);
    });
    const arrComps = {};
    this.components.forEach(component => {
      const clazz = component.clazz;
      const ckey = clazz.prototype._ckey;
      let initialCompProps = {};

      if (clazz.allowMultiple) {
        if (clazz.keyProperty) {
          const key = component.properties[clazz.keyProperty];

          if (prefabProps[ckey] && prefabProps[ckey][key]) {
            initialCompProps = prefabProps[ckey][key];
          }
        } else {
          if (!arrComps[ckey]) {
            arrComps[ckey] = 0;
          }

          if (prefabProps[ckey] && prefabProps[ckey][arrComps[ckey]]) {
            initialCompProps = prefabProps[ckey][arrComps[ckey]];
          }

          arrComps[ckey]++;
        }
      } else {
        initialCompProps = prefabProps[ckey];
      }

      component.applyToEntity(entity, initialCompProps);
    });
    return entity;
  }

}

class PrefabRegistry {
  constructor(engine) {
    _defineProperty(this, "_prefabs", {});

    _defineProperty(this, "_engine", null);

    this._engine = engine;
  }

  deserialize(data) {
    const registered = this.get(data.name);

    if (registered) {
      return registered;
    }

    const prefab = new Prefab(data.name);
    let inherit;

    if (Array.isArray(data.inherit)) {
      inherit = data.inherit;
    } else if (typeof data.inherit === 'string') {
      inherit = [data.inherit];
    } else {
      inherit = [];
    }

    prefab.inherit = inherit.map(parent => {
      const ref = this.get(parent);

      if (!ref) {
        console.warn(`Prefab "${data.name}" cannot inherit from Prefab "${parent}" because is not registered yet! Prefabs must be registered in the right order.`);
        return parent;
      }

      return ref;
    });
    const comps = data.components || [];
    comps.forEach(componentData => {
      if (typeof componentData === 'string') {
        const ckey = camelString(componentData);

        const clazz = this._engine._components.get(ckey);

        if (clazz) {
          prefab.addComponent(new PrefabComponent(clazz));
          return;
        }
      }

      if (typeof componentData === 'object') {
        const ckey = camelString(componentData.type);

        const clazz = this._engine._components.get(ckey);

        if (clazz) {
          prefab.addComponent(new PrefabComponent(clazz, componentData.properties, componentData.overwrite));
          return;
        }
      }

      console.warn(`Unrecognized component reference "${componentData}" in prefab "${data.name}". Ensure the component is registered before the prefab.`);
    });
    return prefab;
  }

  register(data) {
    const prefab = this.deserialize(data);
    this._prefabs[prefab.name] = prefab;
  }

  get(name) {
    return this._prefabs[name];
  }

  create(world, name, properties = {}) {
    const prefab = this.get(name);

    if (!prefab) {
      console.warn(`Could not instantiate prefab "${name}" since it is not registered`);
      return;
    }

    const entity = world.createEntity();
    entity._qeligible = false;
    prefab.applyToEntity(entity, properties);
    entity._qeligible = true;

    entity._candidacy();

    return entity;
  }

}

class Component {
  get world() {
    return this.entity.world;
  }

  get allowMultiple() {
    return this.constructor.allowMultiple;
  }

  get keyProperty() {
    return this.constructor.keyProperty;
  }

  constructor(properties = {}) {
    Object.assign(this, this.constructor.properties, properties);
  }

  destroy() {
    this.entity.remove(this);
  }

  _onDestroyed() {
    this.onDestroyed();
    delete this.entity;
  }

  _onEvent(evt) {
    this.onEvent(evt);

    if (typeof this[evt.handlerName] === 'function') {
      this[evt.handlerName](evt);
    }
  }

  _onAttached(entity) {
    this.entity = entity;
    this.onAttached(entity);
  }

  serialize() {
    const ob = {};

    for (const key in this.constructor.properties) {
      ob[key] = this[key];
    }

    return ob;
  }

  onAttached(entity) {}

  onDestroyed() {}

  onEvent(evt) {}

}

_defineProperty(Component, "allowMultiple", false);

_defineProperty(Component, "keyProperty", null);

_defineProperty(Component, "properties", {});

class EntityEvent {
  constructor(name, data = {}) {
    _defineProperty(this, "data", {});

    _defineProperty(this, "prevented", false);

    _defineProperty(this, "handled", false);

    this.name = name;
    this.data = data;
    this.handlerName = camelString(`on ${this.name}`);
  }

  is(name) {
    return this.name === name;
  }

  handle() {
    this.handled = true;
    this.prevented = true;
  }

  prevent() {
    this.prevented = true;
  }

}

const ONE = 1n;
const subtractBit = (num, bit) => {
  return num & ~(1n << bit);
};
const addBit = (num, bit) => {
  return num | ONE << bit;
};
const hasBit = (num, bit) => {
  return (num >> bit) % 2n !== 0n;
};
const bitIntersection = (n1, n2) => {
  return n1 & n2;
};

const attachComponent = (entity, component) => {
  const key = component.prototype._ckey;
  entity[key] = component;
  entity.components[key] = component;
};

const attachComponentKeyed = (entity, component) => {
  const key = component.prototype._ckey;

  if (!entity.components[key]) {
    entity[key] = {};
    entity.components[key] = {};
  }

  entity[key][component[component.keyProperty]] = component;
  entity.components[key][component[component.keyProperty]] = component;
};

const attachComponentArray = (entity, component) => {
  const key = component.prototype._ckey;

  if (!entity.components[key]) {
    entity[key] = [];
    entity.components[key] = [];
  }

  entity[key].push(component);
  entity.components[key].push(component);
};

const removeComponent = (entity, component) => {
  const key = component.prototype._ckey;
  delete entity[key];
  delete entity.components[key];
  entity._cbits = subtractBit(entity._cbits, component.prototype._cbit);

  entity._candidacy();
};

const removeComponentKeyed = (entity, component) => {
  const key = component.prototype._ckey;
  const keyProp = component[component.keyProperty];
  delete entity[key][keyProp];
  delete entity.components[key][keyProp];

  if (Object.keys(entity[key]).length <= 0) {
    delete entity[key];
    delete entity.components[key];
    entity._cbits = subtractBit(entity._cbits, component.prototype._cbit);

    entity._candidacy();
  }
};

const removeComponentArray = (entity, component) => {
  const key = component.prototype._ckey;
  const idx = entity[key].indexOf(component);
  entity[key].splice(idx, 1);
  entity.components[key].splice(idx, 1);

  if (entity[key].length <= 0) {
    delete entity[key];
    delete entity.components[key];
    entity._cbits = subtractBit(entity._cbits, component.prototype._cbit);

    entity._candidacy();
  }
};

const serializeComponent = component => {
  return component.serialize();
};

const serializeComponentArray = arr => {
  return arr.map(serializeComponent);
};

const serializeComponentKeyed = ob => {
  const ser = {};

  for (const k in ob) {
    ser[k] = serializeComponent(ob[k]);
  }

  return ser;
};

class Entity {
  constructor(world, id) {
    _defineProperty(this, "_cbits", 0n);

    _defineProperty(this, "_qeligible", true);

    this.world = world;
    this.id = id;
    this.components = {};
    this.isDestroyed = false;
  }

  _candidacy() {
    if (this._qeligible) {
      this.world._candidate(this);
    }
  }

  add(clazz, properties) {
    const component = new clazz(properties);

    if (component.keyProperty) {
      attachComponentKeyed(this, component);
    } else if (component.allowMultiple) {
      attachComponentArray(this, component);
    } else {
      attachComponent(this, component);
    }

    this._cbits = addBit(this._cbits, component._cbit);

    component._onAttached(this);

    this._candidacy();
  }

  has(clazz) {
    return hasBit(this._cbits, clazz.prototype._cbit);
  }

  remove(component) {
    if (component.keyProperty) {
      removeComponentKeyed(this, component);
    } else if (component.allowMultiple) {
      removeComponentArray(this, component);
    } else {
      removeComponent(this, component);
    }

    component._onDestroyed();
  }

  destroy() {
    for (const k in this.components) {
      const v = this.components[k];

      if (v instanceof Component) {
        this._cbits = subtractBit(this._cbits, v._cbit);

        v._onDestroyed();
      } else if (v instanceof Array) {
        for (const component of v) {
          this._cbits = subtractBit(this._cbits, component._cbit);

          component._onDestroyed();
        }
      } else {
        for (const component of Object.values(v)) {
          this._cbits = subtractBit(this._cbits, component._cbit);

          component._onDestroyed();
        }
      }

      delete this[k];
      delete this.components[k];
    }

    this._candidacy();

    this.world._destroyed(this.id);

    this.components = {};
    this.isDestroyed = true;
  }

  serialize() {
    const components = {};

    for (const k in this.components) {
      const v = this.components[k];

      if (v instanceof Component) {
        components[k] = serializeComponent(v);
      } else if (v instanceof Array) {
        components[k] = serializeComponentArray(v);
      } else {
        components[k] = serializeComponentKeyed(v);
      }
    }

    return {
      id: this.id,
      ...components
    };
  }

  fireEvent(name, data) {
    const evt = new EntityEvent(name, data);

    for (const key in this.components) {
      const v = this.components[key];

      if (v instanceof Component) {
        v._onEvent(evt);

        if (evt.prevented) {
          return evt;
        }
      } else if (v instanceof Array) {
        for (let i = 0; i < v.length; i++) {
          v[i]._onEvent(evt);

          if (evt.prevented) {
            return evt;
          }
        }
      } else {
        for (const component of Object.values(v)) {
          component._onEvent(evt);

          if (evt.prevented) {
            return evt;
          }
        }
      }
    }

    return evt;
  }

}

class Query {
  constructor(world, filters) {
    _defineProperty(this, "_cache", []);

    _defineProperty(this, "_onAddListeners", []);

    _defineProperty(this, "_onRemoveListeners", []);

    this._world = world;
    const any = filters.any || [];
    const all = filters.all || [];
    const none = filters.none || [];
    this._any = any.reduce((s, c) => {
      return addBit(s, c.prototype._cbit);
    }, 0n);
    this._all = all.reduce((s, c) => {
      return addBit(s, c.prototype._cbit);
    }, 0n);
    this._none = none.reduce((s, c) => {
      return addBit(s, c.prototype._cbit);
    }, 0n);
    this.refresh();
  }

  onEntityAdded(fn) {
    this._onAddListeners.push(fn);
  }

  onEntityRemoved(fn) {
    this._onRemoveListeners.push(fn);
  }

  has(entity) {
    return this.idx(entity) >= 0;
  }

  idx(entity) {
    return this._cache.indexOf(entity);
  }

  matches(entity) {
    const bits = entity._cbits;
    const any = this._any === 0n || bitIntersection(bits, this._any) > 0;

    const all = bitIntersection(bits, this._all) === this._all;

    const none = bitIntersection(bits, this._none) === 0n;
    return any && all && none;
  }

  candidate(entity) {
    const idx = this.idx(entity);
    const isTracking = idx >= 0;

    if (!entity.isDestroyed && this.matches(entity)) {
      if (!isTracking) {
        this._cache.push(entity);

        this._onAddListeners.forEach(cb => cb(entity));
      }

      return true;
    }

    if (isTracking) {
      this._cache.splice(idx, 1);

      this._onRemoveListeners.forEach(cb => cb(entity));
    }

    return false;
  }

  refresh() {
    this._cache = [];

    this._world._entities.forEach(entity => {
      this.candidate(entity);
    });
  }

  get() {
    return this._cache;
  }

}

class World {
  constructor(engine) {
    _defineProperty(this, "_id", 0);

    _defineProperty(this, "_queries", []);

    _defineProperty(this, "_entities", new Map());

    this.engine = engine;
  }

  createId() {
    return ++this._id + Math.random().toString(36).substr(2, 9);
  }

  getEntity(id) {
    return this._entities.get(id);
  }

  getEntities() {
    return this._entities.values();
  }

  createEntity(id = this.createId()) {
    const entity = new Entity(this, id);

    this._entities.set(id, entity);

    return entity;
  }

  destroyEntity(id) {
    const entity = this.getEntity(id);

    if (entity) {
      entity.destroy();
    }
  }

  destroyEntities() {
    this._entities.forEach(entity => {
      entity.destroy();
    });
  }

  destroy() {
    this.destroyEntities();
    this._id = 0;
    this._queries = [];
    this._entities = new Map();
  }

  createQuery(filters) {
    const query = new Query(this, filters);

    this._queries.push(query);

    return query;
  }

  createPrefab(name, properties = {}) {
    return this.engine._prefabs.create(this, name, properties);
  }

  serialize(entities) {
    const json = [];
    const list = entities || this._entities;
    list.forEach(e => {
      json.push(e.serialize());
    });
    return {
      entities: json
    };
  }

  deserialize(data) {
    for (const entityData of data.entities) {
      this._createOrGetEntityById(entityData.id);
    }

    for (const entityData of data.entities) {
      this._deserializeEntity(entityData);
    }
  }

  _createOrGetEntityById(id) {
    return this.getEntity(id) || this.createEntity(id);
  }

  _deserializeEntity(data) {
    const {
      id,
      ...components
    } = data;

    const entity = this._createOrGetEntityById(id);

    entity._qeligible = false;
    Object.entries(components).forEach(([key, value]) => {
      const type = camelString(key);

      const def = this.engine._components.get(type);

      if (def.allowMultiple) {
        Object.values(value).forEach(d => {
          entity.add(def, d);
        });
      } else {
        entity.add(def, value);
      }
    });
    entity._qeligible = true;

    entity._candidacy();
  }

  _candidate(entity) {
    this._queries.forEach(q => q.candidate(entity));
  }

  _destroyed(id) {
    return this._entities.delete(id);
  }

}

class Engine {
  constructor() {
    _defineProperty(this, "_components", new ComponentRegistry());

    _defineProperty(this, "_prefabs", new PrefabRegistry(this));
  }

  registerComponent(clazz) {
    this._components.register(clazz);
  }

  registerPrefab(data) {
    this._prefabs.register(data);
  }

  createWorld() {
    return new World(this);
  }

  destroyWorld(world) {
    world.destroy();
  }

}

export { Component, Engine };
//# sourceMappingURL=index.js.map
