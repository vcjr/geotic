import { Component } from '../src/Component';
import { Engine } from '../src/Engine';

const engine = new Engine();
const world = engine.createWorld();

class Action extends Component {
    static properties = {
        name: 'testtst',
        data: {},
    };

    static allowMultiple = true;

    onAttached() {
        console.log(`action ${this.name} attached`);
    }

    onDetached() {
        console.log(`action ${this.name} detached`);
    }

    onTesting(evt) {
        console.log('Action onTesting', evt.data);
    }
}

class Slot extends Component {
    static allowMultiple = true;
    static keyProperty = 'name';
    static properties = {
        name: 'hello',
    };

    onTesting(evt) {
        console.log('Slot onTesting', evt.data);
    }
}

class Position extends Component {
    static properties = {
        x: 0,
        y: 0,
    };

    onTesting(evt) {
        console.log('Position onTesting', evt.data);
    }
}

engine.registerComponent(Action);
engine.registerComponent(Slot);
engine.registerComponent(Position);

engine.registerPrefab({
    name: 'Base',
    components: [
        {
            type: 'Position',
            properties: {
                x: 11,
                y: 12,
            },
        },
    ],
});

engine.registerPrefab({
    name: 'Thing',
    inherit: ['Base'],
    components: [
        {
            type: 'Action',
            properties: {
                name: 'thing',
            },
        },
        'Action',
    ],
});

const e = world.createEntity();

e.add(Position, {
    x: 7,
    y: 3,
});

e.add(Action, {
    name: 'actionA',
    data: {
        hello: 'world',
    },
});

e.add(Action, {
    name: 'actionB',
    data: {
        hello: 'world',
    },
});

e.add(Slot, {
    name: 'hand',
});

e.add(Slot, {
    name: 'head',
});

// e.position.destroy();
// e.action[0].destroy();
// e.remove(e.action[0]);
// e.remove(e.action[0]);
// e.remove(e.slot.hand);
// e.remove(e.slot.head);

e.remove(e.position);
// e.remove(e.slot.hand);
// e.remove(e.slot.head);
// e.remove(e.action[0]);
// e.remove(e.action[0]);

e.fireEvent('testing', {
    hello: 'world',
});

const query = world.createQuery({
    any: [Slot],
    all: [Action],
    none: [Position],
});

// console.log(world.serialize());

// e.destroy();

// console.log(e.serialize());

const e2 = world.createPrefab('Thing', {
    position: {
        x: 8,
    },
});

// const e2 = world.createEntity();
// e2.add(Action);

console.log(JSON.stringify(e2.serialize(), null, 2));

// const world2 = engine.createWorld();

// console.log(JSON.stringify(world.serialize(), null, 2));

// world2.deserialize(world.serialize());

// console.log(JSON.stringify(world2.serialize(), null, 2));

// console.log(e._cbits);
// console.log('Slot', Slot.prototype._cbit, e.has(Slot));
// console.log('Position', Position.prototype._cbit, e.has(Position));
// console.log('Action', Action.prototype._cbit, e.has(Action));
// e.destroy();
// console.log(JSON.stringify(e.serialize(), null, 2));
