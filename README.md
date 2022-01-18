# What you'll need

* NodeJS v16+
* Yarn (I have v1.22.5)
* Some kind of IDE, VSCode is what I recommend.

# Getting Started

* run ``yarn install``
* run ``yarn setup``
* run ``yarn dev`` or ``yarn watch``

# Getting your work-in-progress into TTPG

``yarn dev`` will copy (or transpile) the code within the /src directory and throw it into TTPG. It will be a one time operation. If you make a change to scripts within /src  you will need to run it again.

``yarn watch`` however, will run in your terminal and watch for changes. If you edit a file in /src it will live update the scripts in TTPG's folder.

# Bundling

if you run ``yarn bundle`` it will package build your scripts from the ``src/`` folder, build the ``node_modules`` folder that TTPG will need, and take the contents of your ``assets/`` and throw it into a Zip file within ``bundles/``.

you can also run ``yarn build`` to get a Production build of your mod into TTPG for adding to mod.io

# Cleaning

if you run ``yarn clean`` it will remove the ``dev/`` folder, as well as the project folder within your ttpg system and remove and temporary files. You can then run ``yarn setup`` again to get everything re-allocated.

# Utilities

``yarn guid [n]`` will generate n GUIDs for you (default 1). use ``yarn (--silent|-s) guid [n]`` to surpress yarn's wrapping output and just get the GUIDS you requested.

# Adding Modules

Any dependency you add with ``yarn add {module}`` will be added to the bundle and can be ``require``d by a script in game.

Dependencies added with ``yarn add -D {module}`` (devDependenices) will ***not*** get bundled or built for the end project.

# Transpiling

as of right now, transpiling is off. Ecma6 syntax is good to go, but Ecma2020 (null coalesce, optional chaining, etc) is a no go for now. This may change.
