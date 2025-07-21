Hooks.once("item-piles-ready", async () => {
  const data = {
    VERSION: "1.0.3",

    // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
    ACTOR_CLASS_TYPE: "character",

    // The item class type is the type of item that will be used for the default loot item
    ITEM_CLASS_LOOT_TYPE: "item",

    // The item class type is the type of item that will be used for the default weapon item
    ITEM_CLASS_WEAPON_TYPE: "weapon",

    // The item class type is the type of item that will be used for the default equipment item
    ITEM_CLASS_EQUIPMENT_TYPE: "item",

    // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
    ITEM_QUANTITY_ATTRIBUTE: "flags.item-piles.system.quantityForPrice",

    // The item price attribute is the path to the attribute on each item that determine how much it costs
    ITEM_PRICE_ATTRIBUTE: "system.value",

    // The quantity for price attribute is the path to the attribute on each item that determine how many you get for its price
    QUANTITY_FOR_PRICE_ATTRIBUTE: "system.quantity",

    // Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
    ITEM_FILTERS: [
      {
        path: "type",
        filters: "ancestry,creaturerole,endoftheround,feature,language,path,profession,specialaction,spell,talent",
      },
    ],

    // Item similarities determines how item piles detect similarities and differences in the system
    ITEM_SIMILARITIES: ["name", "type"],

    // This function is an optional system handler that specifically transforms an item when it is added to actors, eg turns it into a spell scroll if it was a spell
    ITEM_TRANSFORMER: async itemData => {
      if (itemData.type === "weapon" || itemData.type === "armor") foundry.utils.setProperty(itemData, "system.wear", false)
      return itemData
    },

    ITEM_COST_TRANSFORMER: (item, currencies) => {
      let itemCost = item.system.value
      itemCost = itemCost.trim()

      let ssValue = itemCost === "" ? 0 : parseInt(itemCost.replace(/\D/g, ""))

      const overallCost = ssValue
      let priceDenomination = itemCost.replace(/\d/g, "").trim() === "" ? "ss" : itemCost.replace(/\d/g, "").trim()
      if (priceDenomination) {
        const currencyDenomination = currencies
          .filter(currency => currency.type === "attribute")
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
          label: "DL.Availability",
          path: "system.availability",
          formatting: "{#}",
          buying: true,
          selling: true,
          mapping: {
            C: "DL.AvailabilityC",
            U: "DL.AvailabilityU",
            R: "DL.AvailabilityR",
            E: "DL.AvailabilityE",
          },
        },
      ],
    },

    // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
    // In the case of attributes, the path is relative to the "actor.system"
    // In the case of items, it is recommended you export the item with `.toObject()`, put it into `data.item`, and strip out any module data
    CURRENCIES: [
      {
        type: "attribute",
        name: "Gold Crowns",
        img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
        abbreviation: "{#} gc",
        data: {
          path: "system.wealth.gc",
        },
        primary: true,
        exchangeRate: 1,
      },
      {
        type: "attribute",
        name: "Silver Shillings",
        img: "icons/commodities/currency/coin-inset-compass-silver.webp",
        abbreviation: "{#} ss",
        data: {
          path: "system.wealth.ss",
        },
        primary: false,
        exchangeRate: 0.1,
      },
      {
        type: "attribute",
        name: "Copper Pennies",
        img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
        abbreviation: "{#} cp",
        data: {
          path: "system.wealth.cp",
        },
        primary: false,
        exchangeRate: 0.01,
      },
      {
        type: "attribute",
        name: "Bits",
        img: "icons/commodities/currency/coins-assorted-mix-platinum.webp",
        abbreviation: "{#} bits",
        data: {
          path: "system.wealth.bits",
        },
        primary: false,
        exchangeRate: 0.001,
      },
    ],

    VAULT_STYLES: [],

    SYSTEM_HOOKS: () => {
      Hooks.on("item-piles-preAddItems", (target, itemsToCreate, itemQuantitiesToUpdate, interactionId) => {
        const actor = target instanceof Actor ? target : target.actor
        let isItemPile = actor.getFlag("item-piles", "data.enabled")
        if (actor.type === "creature" || isItemPile) {
          itemsToCreate.forEach(item => {
            if (item.system.wear) item.system.wear = false
            const itemEffects = item.effects
            itemEffects.forEach(effect => {
              if (effect.transfer) effect.disabled = true
            })
          })
        }
      })

      Hooks.on("item-piles-preTransferItems", (source, sourceUpdates, target, targetUpdates, interactionId) => {
        const sourceActor = target instanceof Actor ? source : source.actor
        const targetActor = target instanceof Actor ? target : target.actor
        let allItems = targetUpdates.itemsToCreate
        allItems = allItems.concat(targetUpdates.itemDeltas)
        allItems.forEach(item => {
          const type = item.type
          if (["armor", "item", "relic"].includes(type)) {
            const itemEffects = item.effects
            itemEffects.forEach(effect => {
              if (effect.transfer) effect.disabled = false
            })
          }
        })
      })

      Hooks.on("item-piles-preTradeItems", (sellingActor, sellerUpdates, buyingActor, buyerUpdates, userId, interactionId) => {
        let allItems = buyerUpdates.itemsToCreate
        allItems = allItems.concat(buyerUpdates.itemsToUpdate)
          allItems.forEach(item => {
            const type = item.type
            if (["armor", "item", "relic"].includes(type)) {
              const itemEffects = item.effects
              itemEffects.forEach(effect => {
                console.warn('EFFECT:',effect )
                if (effect.transfer) effect.disabled = false
              })
            }
          })
      })
    },

    SHEET_OVERRIDES: () => {},
  }

  await game.itempiles.API.addSystemIntegration(data)
})
