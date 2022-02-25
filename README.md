# What you'll need

-   NodeJS v16+
-   Yarn (I have v1.22.5)
-   Some kind of IDE, VSCode is what I recommend.

# Getting Started

-   run `yarn setup`

# Getting your work-in-progress into TTPG

`yarn dev` will copy (or transpile) the code within the /src directory and throw it into TTPG. It will be a one time operation. If you make a change to scripts within /src you will need to run it again.

`yarn watch` however, will run in your terminal and watch for changes. If you edit a file in /src it will live update the scripts in TTPG's folder.

# Bundling

if you run `yarn bundle` it will package build your scripts from the `src/` folder, build the `node_modules` folder that TTPG will need, and take the contents of your `assets/` and throw it into a Zip file within `bundles/`.

you can also run `yarn build` to get a Production build of your mod into TTPG for adding to mod.io

# Cleaning

if you run `yarn clean` it will remove the `dev/` folder, as well as the project folder within your ttpg system and remove and temporary files. You can then run `yarn setup` again to get everything re-allocated.

# Prettier

This project uses `prettier` as a formatter for code, as well as json, yaml, and markdown content. Most editors can be set up to apply formatting when you save; for instance, with VSCode, you can enable the "Editor: Format On Save" setting and install the [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension.

# Utilities

`yarn guid [n]` will generate n GUIDs for you (default 1). use `yarn (--silent|-s) guid [n]` to surpress yarn's wrapping output and just get the GUIDS you requested.

# Adding Modules

Any dependency you add with `yarn add {module}` will be added to the bundle and can be `require`d by a script in game.

Dependencies added with `yarn add -D {module}` (devDependenices) will **_not_** get bundled or built for the end project.

# Transpiling

as of right now, transpiling is off. Ecma6 syntax is good to go, but Ecma2020 (null coalesce, optional chaining, etc) is a no go for now. This may change.

# Homebrew Content & Expansions

## Strategy Cards

To add new strategy cards, the following code can be used within the object script attached to the strategy card:

```javascript
const {
    onUiClosedClicked,
    RegisterStrategyCardUI,
} = require("<..>/objects/strategy-cards/strategy-card");

const locale = require("<..>/lib/locale");
const { Button, Color } = require("<..>/wrapper/api");

// ...

const widgetFactory = (
    playerDesk /* of the UI owning player */,
    packageId /* of the card object */
) => {
    let button = new Button().setText("Done!");
    button.onClicked.add(/* callback of your strategy card logic */);
    button.onClicked.add(onUiClosedClicked); // callback closing the UI and handling the "all players resolved" and stacking UIs
};

new RegisterStrategyCardUI()
    .setCard(refObject)
    .setWidgetFactory(widgetFactory)
    .setHeight(/* height in px */)
    .setWidth(/* width in px, optional, default 350 px */)
    .setColor(new Color(1, 0, 0) /* ttpg-Color of the background */)
    .register();
```

To send messages in the chat and color code the message in the players color a helper is available:

```javascript
const { Broadcast } = require("<..>/lib/broadcast");
const locale = require("<..>/lib/locale");

//...

Broadcast.chatAll(
    locale("messageKey"),
    player.getPlayerColor() // coloring the text message in a players color
);
```

For using a plain UI with only a "primary", "secondary" and "pass" button, the registration can be narrowed down to:

```javascript
const { refObject, Color } = require("<..>/wrapper/api");
require("<..>/objects/strategy-cards/register-standard-card")(
    refObject,
    "<myStrategyCard>", // text key section for locale (see below)
    new Color(1, 0, 0) // ttpg-color of the background
);
```

The text key is used for the header label as well as for sending notifications when a button was clicked.
On messages in addition the clicking `player` is passed as a text property.

```json
{
    "strategy_card.<myStrategyCard>.text": "MY CARD",
    "strategy_card.<myStrategyCard>.message.primary": "{player} is using the primary ability of MY CARD.",
    "strategy_card.<myStrategyCard>.message.secondary": "{player} is using the primary ability of MY CARD.",
    "strategy_card.<myStrategyCard>.message.pass": "{player} says 'Nah. I dont wanna use MY CARD.'"
}
```
