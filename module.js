Hooks.once('item-piles-ready', async () => {
  const data = {
    VERSION: "1.0.0",

    // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
    ACTOR_CLASS_TYPE: 'character',

    // The item class type is the type of item that will be used for the default loot item
    ITEM_CLASS_LOOT_TYPE: 'item',

    // The item class type is the type of item that will be used for the default weapon item
    ITEM_CLASS_WEAPON_TYPE: 'weapon',

    // The item class type is the type of item that will be used for the default equipment item
    ITEM_CLASS_EQUIPMENT_TYPE: 'item',

    // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
    ITEM_QUANTITY_ATTRIBUTE: 'system.quantity',

    // The item price attribute is the path to the attribute on each item that determine how much it costs
    ITEM_PRICE_ATTRIBUTE: 'system.value',

    // The quantity for price attribute is the path to the attribute on each item that determine how many you get for its price
    QUANTITY_FOR_PRICE_ATTRIBUTE: 'system.quantity',

    // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
    ITEM_FILTERS: [
      {
        path: 'type',
        filters: 'ancestry,creaturerole,endoftheround,feature,language,path,profession,specialaction,spell,talent',
      },
    ],

    // Item similarities determines how item piles detect similarities and differences in the system
    ITEM_SIMILARITIES: ['name', 'type'],

    // This function is an optional system handler that specifically transforms an item when it is added to actors, eg turns it into a spell scroll if it was a spell
    ITEM_TRANSFORMER: async itemData => {
      return itemData
    },

    ITEM_COST_TRANSFORMER: (item, currencies) => {
      let itemCost = item.system.value
      itemCost = itemCost.trim()

      let ssValue = itemCost === '' ? 0 : parseInt(itemCost.replace(/\D/g, ''))

      const overallCost = ssValue
      let priceDenomination = itemCost.replace(/\d/g, '').trim() === '' ? 'ss' : itemCost.replace(/\d/g, '').trim()
      if (priceDenomination) {
        const currencyDenomination = currencies
          .filter(currency => currency.type === 'attribute')
          .find(currency => {
            return currency.data.path.toLowerCase().endsWith(priceDenomination)
          })
        if (currencyDenomination) {
          return overallCost * currencyDenomination.exchangeRate
        }
      }
      return overallCost ?? 0
    },

    PILE_DEFAULTS: {
      merchantColumns: [
        {
          label: 'DL.Availability',
          path: 'system.availability',
          formatting: '{#}',
          buying: true,
          selling: true,
          mapping: {
            C: 'DL.AvailabilityC',
            U: 'DL.AvailabilityU',
            R: 'DL.AvailabilityR',
            E: 'DL.AvailabilityE',
          },
        },
      ],
    },

    // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
    // In the case of attributes, the path is relative to the "actor.system"
    // In the case of items, it is recommended you export the item with `.toObject()`, put it into `data.item`, and strip out any module data
    CURRENCIES: [
      {
        type: 'attribute',
        name: 'Gold Crowns',
        img: 'icons/commodities/currency/coin-embossed-crown-gold.webp',
        abbreviation: '{#} gc',
        data: {
          path: 'system.wealth.gc',
        },
        primary: true,
        exchangeRate: 1,
      },
      {
        type: 'attribute',
        name: 'Silver Shillings',
        img: 'icons/commodities/currency/coin-inset-compass-silver.webp',
        abbreviation: '{#} ss',
        data: {
          path: 'system.wealth.ss',
        },
        primary: false,
        exchangeRate: 0.1,
      },
      {
        type: 'attribute',
        name: 'Copper Pennies',
        img: 'icons/commodities/currency/coin-engraved-waves-copper.webp',
        abbreviation: '{#} cp',
        data: {
          path: 'system.wealth.cp',
        },
        primary: false,
        exchangeRate: 0.01,
      },
      {
        type: 'attribute',
        name: 'Bits',
        img: 'icons/commodities/currency/coins-assorted-mix-platinum.webp',
        abbreviation: '{#} bits',
        data: {
          path: 'system.wealth.bits',
        },
        primary: false,
        exchangeRate: 0.001,
      },
    ],

    VAULT_STYLES: [],

    SYSTEM_HOOKS: () => {},

		"SHEET_OVERRIDES": () => {
			const actorSheetOverride = 'CONFIG.Actor.sheetClasses.character["demonlord.DLCharacterSheet"].cls.prototype.render'

			libWrapper.register("item-piles-demonlord", actorSheetOverride, function (wrapped, forced, options, ...args) {
				const renderItemPileInterface = Hooks.call(game.itempiles.CONSTANTS.HOOKS.PRE_RENDER_SHEET, this.document, forced, options) === false;
				if (this._state > Application.RENDER_STATES.NONE) {
					if (renderItemPileInterface) {
						wrapped(forced, options, ...args)
					} else {
						return wrapped(forced, options, ...args)
					}
				}
				if (renderItemPileInterface) return;
				return wrapped(forced, options, ...args);
			}, "MIXED");
		}    
  }

  await game.itempiles.API.addSystemIntegration(data)
})
