const express = require("express");
const cors = require("cors");
const bodyparser = require("body-parser");
const db = require("./db.js");

const app = express();
const secrettoken = "myinventorytoken";

app.use(bodyparser.json());
app.use(cors());

//User Accounts
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  db.query(
    "SELECT * FROM user_accounts WHERE user_email = ? AND user_password = ?",
    [email, password],
    (error, results, fields) => {
      if (error) throw error;

      if (results.length > 0) {
        res.json({ success: true, secrettoken, results });
      } else {
        res.json({ success: false });
      }
    }
  );
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Error destroying session");
    }
    res.redirect("/login");
  });
});

app.get("/api/users", (req, res) => {
  const query = "SELECT *  FROM `itemschema`.`user_accounts`;";
  db.query(query, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

app.post("/api/register", (req, res) => {
  const { firstname, lastname, role, email, password } = req.body;
  db.query(
    "INSERT INTO user_accounts (user_firstname, user_lastname, user_role, user_email, user_password) VALUES (?, ?, ?, ?, ?)",
    [firstname, lastname, role, email, password],
    (error, results, fields) => {
      if (error) throw error;
      res.json({ success: true, secrettoken, results });
    }
  );
});

app.get("/api/isLoggedIn", (req, res) => {
  const { token } = req.query;
  if (token === secrettoken) {
    res.json({ isLoggedIn: true });
  } else {
    res.json({ isLoggedIn: false });
  }
});

//Items
app.get("/api/inventory", (req, res) => {
  const query =
    "SELECT *, DATE_FORMAT(`createdAt`, '%m/%d/%Y %H:%i:%s') as `createdAtFormatted`,DATE_FORMAT(`updatedAt`, '%m/%d/%Y') as `updatedAtFormatted` FROM `itemschema`.`inventory_db`;";
  db.query(query, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

app.post("/api/inventory/item", (req, res) => {
  const query =
    "INSERT INTO inventory_db (`name`, `brand`, `category`, `price`, `quantity`, `sellingPrice`) VALUES (?)";
  const values = [
    req.body.name,
    req.body.brand,
    req.body.category,
    req.body.price,
    req.body.quantity,
    req.body.sellingPrice,
  ];
  db.query(query, [values], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

app.post("/api/inventory/logs", (req, res) => {
  const query =
    "INSERT INTO  item_log_db (`name`, `brand`, `quantity`, `cost`, `sellingPrice`) VALUES (?)";
  const values = [
    req.body.name,
    req.body.brand,
    req.body.quantity,
    req.body.price,
    req.body.sellingPrice,
  ];
  db.query(query, [values], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});
app.put("/api/inventory/purchase/:id", (req, res) => {
  const query = "UPDATE inventory_db SET   `quantity` = ?  WHERE id = ?";
  const values = [req.body.quantity];
  db.query(query, [...values, req.params.id], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    if (req.body.quantity === 0) {
      const deleteQuery = `DELETE FROM inventory_db WHERE id = ${req.params.id}`;

      db.query(deleteQuery, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: "Internal server error" });
        }

        return res.json({ message: "Item deleted" });
      });
    } else {
      return res.status(200).json({ message: "Item updated", data: data });
    }
  });
});
app.put("/api/inventory/:id", (req, res) => {
  const query =
    "UPDATE inventory_db SET `name` = ?, `brand` = ?, `category` = ?, `price` = ?, `sellingPrice` = ? WHERE id = ?";
  const values = [
    req.body.name,
    req.body.brand,
    req.body.category,
    req.body.price,
    req.body.sellingPrice,
  ];
  db.query(query, [...values, req.params.id], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    } else {
      return res.status(200).json({ message: "Item updated", data: data });
    }
  });
});
app.put("/api/inventory/logs/:id", (req, res) => {
  const query =
    "UPDATE  item_log_db  SET `name` = ?, `brand` = ?, `cost` = ?, `sellingPrice` = ? WHERE id = ?";
  const values = [
    req.body.name,
    req.body.brand,
    req.body.price,
    req.body.sellingPrice,
  ];
  db.query(query, [...values, req.params.id], (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    } else {
      return res.status(200).json({ message: "Item updated", data: data });
    }
  });
});

app.delete("/api/inventory/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM inventory_db WHERE id = ?";
  db.query(query, id, (err, res) => {
    if (err) console.log(err);
  });
  return res.json("Deleted");
});

app.get("/api/transact", (req, res) => {
  const query = "SELECT MAX(transact_id) AS id FROM transact;";
  db.query(query, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

app.get("/api/sales", (req, res) => {
  const query =
    "SELECT *, DATE_FORMAT(`date`, '%m/%d/%Y') as `dateFormatted`  FROM sales_db";
  db.query(query, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});
app.get("/api/log", (req, res) => {
  const query =
    "SELECT *, DATE_FORMAT(`updatedAt`,'%m/%d/%Y')  as `dateFormatted` FROM `itemschema`.`item_log_db`";
  db.query(query, req.params.id, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

app.get("/api/transact/:id", (req, res) => {
  const query = "SELECT * FROM transact WHERE transact_id = ?";
  db.query(query, req.params.id, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

app.get("/api/purchase/added", (req, res) => {
  const query = "SELECT * FROM purchase_log_db";
  db.query(query, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});
app.post("/api/purchase", (req, res) => {
  const selectQuery =
    "SELECT * FROM purchase_log_db WHERE `item` = ? AND `brand` = ?";
  const insertQuery =
    "INSERT INTO purchase_log_db (`item`, `brand`, `category`, `quantity`, `price`, `sellingPrice`, `totalPrice`) VALUES (?,?,?,?,?,?,?)";
  const updateQuery =
    "UPDATE purchase_log_db SET `quantity` = `quantity` + ? WHERE `item` = ? AND `brand` = ?";

  const values = [
    req.body.name,
    req.body.brand,
    req.body.category,
    req.body.quantity,
    req.body.price,
    req.body.sellingPrice,
    req.body.totalPrice,
  ];

  db.query(selectQuery, [req.body.name, req.body.brand], (err, result) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }

    if (result.length > 0) {
      db.query(
        updateQuery,
        [req.body.quantity, req.body.name, req.body.brand],
        (err, data) => {
          if (err) {
            console.log(err);
            return res.json(err);
          }
          return res.json(data);
        }
      );
    } else {
      db.query(insertQuery, values, (err, data) => {
        if (err) {
          console.log(err);
          return res.json(err);
        }
        return res.json(data);
      });
    }
  });
});

app.post("/api/purchase/new", (req, res) => {
  const query = "INSERT INTO transact (`totalSum`) VALUES (?)";
  const value = req.body.totalSum;
  db.query(query, value, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});

app.post("/api/purchase/clear", (req, res) => {
  const query = "truncate purchase_log_db";
  db.query(query, (err, data) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    return res.json(data);
  });
});
app.post("/api/sales/add", (req, res) => {
  const data = req.body;
  const query =
    "INSERT INTO sales_db (`transact_id`, `item`, `brand`, `category`, `price`, `sellPrice`, `quantity`, `totalPrice`) VALUES ?;";
  const values = data.map((row) => [
    row.transactId,
    row.desc,
    row.brand,
    row.category,
    row.price,
    row.sellPrice,
    row.unit,
    row.totalprice,
  ]);
  db.query(query, [values], (err, result) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    let updateQuery =
      "UPDATE inventory_db SET `quantity` = `quantity` - CASE `name` ";
    const updateValues = [];

    data.forEach((row) => {
      updateQuery += `WHEN '${row.desc}' THEN ? `;
      updateValues.push(row.unit);
    });
    updateQuery +=
      "ELSE 0 END WHERE `name` IN (" +
      data.map((row) => `'${row.desc}'`).join(",") +
      ")";
    console.log(updateQuery);
    db.query(updateQuery, updateValues, (err, result) => {
      if (err) {
        return res.json(err);
      }
      return res.json(result);
    });
  });
});

app.put("/api/transact/:id", (req, res) => {
  const query = "UPDATE transact SET `totalSum` = ? WHERE transact_id = ?";
  const values = req.body.totalSum;
  db.query(query, [values, req.params.id], (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
