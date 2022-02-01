### Units: attributes, modifiers, plastic

Use `AuxData.createForPair` to get unit data accounting for:

-   player unit upgrades ("Carrier II")
-   self-modifiers ("Morale Boost")
-   from-opponent-modifiers ("Disable")
-   faction abilities ("Fragile")

It will find all units in the primary hex as well as adjacent hexes, assigning cardboard tokens to the closest in-hex plastic.
