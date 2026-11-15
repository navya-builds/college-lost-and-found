const Item = require("../models/Item");
const Claim = require("../models/Claim");

// Items reported by the logged-in user
async function getMyItems(req, res) {
    try {
        const items = await Item.find({ reportedBy: req.user._id }).sort({
            createdAt: -1
        });

        const itemIds = items.map(item => item._id);

        // Pending claims count for each of my items
        const pending = await Claim.aggregate([
            { $match: { item: { $in: itemIds }, status: "pending" } },
            { $group: { _id: "$item", count: { $sum: 1 } } }
        ]);

        const pendingByItem = new Map(
            pending.map(row => [row._id.toString(), row.count])
        );

        res.json(
            items.map(item => {
                const data = item.toJSON();

                delete data.reportedBy;
                delete data.imagePublicId;

                data.pendingClaims = pendingByItem.get(item._id.toString()) || 0;

                return data;
            })
        );
    } catch (error) {
        console.error("Error loading my items:", error);
        res.status(500).json({ message: "Could not load your items." });
    }
}

// Claims that I sent on other people's items
async function getMyClaims(req, res) {
    try {
        const claims = await Claim.find({ claimant: req.user._id })
            .populate("item", "name status imageUrl contact")
            .sort({ createdAt: -1 });

        res.json(
            claims.map(claim => {
                const item = claim.item;

                return {
                    id: claim._id.toString(),
                    status: claim.status,
                    message: claim.message,
                    createdAt: claim.createdAt,
                    item: item
                        ? {
                              id: item._id.toString(),
                              name: item.name,
                              status: item.status,
                              imageUrl: item.imageUrl,
                              // The contact is shared only after approval
                              contact:
                                  claim.status === "approved"
                                      ? item.contact
                                      : undefined
                          }
                        : null
                };
            })
        );
    } catch (error) {
        console.error("Error loading my claims:", error);
        res.status(500).json({ message: "Could not load your claims." });
    }
}

// Claims that other people sent on my items
async function getReceivedClaims(req, res) {
    try {
        const myItems = await Item.find({ reportedBy: req.user._id }).select(
            "name status"
        );

        const itemMap = new Map(myItems.map(item => [item._id.toString(), item]));

        const claims = await Claim.find({
            item: { $in: myItems.map(item => item._id) }
        })
            .populate("claimant", "name email")
            .sort({ createdAt: -1 });

        res.json(
            claims.map(claim => {
                const item = itemMap.get(claim.item.toString());

                return {
                    id: claim._id.toString(),
                    status: claim.status,
                    message: claim.message,
                    createdAt: claim.createdAt,
                    claimant: claim.claimant
                        ? {
                              name: claim.claimant.name,
                              email: claim.claimant.email
                          }
                        : null,
                    item: item
                        ? {
                              id: item._id.toString(),
                              name: item.name,
                              status: item.status
                          }
                        : null
                };
            })
        );
    } catch (error) {
        console.error("Error loading received claims:", error);
        res.status(500).json({ message: "Could not load received claims." });
    }
}

module.exports = { getMyItems, getMyClaims, getReceivedClaims };