import express from "express";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import * as url from "url";
import bcrypt from "bcryptjs";
import * as jwtJsDecode from "jwt-js-decode";
import base64url from "base64url";
import SimpleWebAuthnServer from "@simplewebauthn/server";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const app = express();
app.use(express.json());

const adapter = new JSONFile(__dirname + "/auth.json");
const db = new Low(adapter);
await db.read();
db.data ||= { users: [] };

const rpID = "localhost";
const protocol = "http";
const port = 5050;
const expectedOrigin = `${protocol}://${rpID}:${port}`;

app.use(express.static("public"));
app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	})
);

function findUser(email) {
	const results = db.data.users.filter((user) => user.email === email);
	if (results.length === 0) return undefined;
	return results[0];
}

// ADD HERE THE REST OF THE ENDPOINTS
app.post("/auth/login", async (req, res) => {
	const userFound = findUser(req.body.email);
	if (userFound) {
		//User found , check password
		if (bcrypt.compareSync(userFound.password == req.body.password)) {
			res.ok({ ok: true, name: userFound.name, email: userFound.email });
		} else {
			res.send({ ok: false, message: "Incorrect password" });
		}
	} else {
		//User not found, return error message
		res.send({ ok: false, message: "User not found" });
	}
});

app.post("/auth/register", async (req, res) => {
	const salt = bcrypt.genSaltSync(10);
	hashedpass = bcrypt.hashSync(req.body.password, salt);

	// TODO: Data validation
	const user = {
		name: req.body.name,
		email: req.body.email,
		password: hashedpass,
		// password: req.body.password,
	};
	const userFound = findUser(user.email);
	if (userFound) {
		//User already esists, return error message
		res.send({ ok: false, message: "User already exists" });
	} else {
		// User is new - we are good
		db.data.users.push(user);
		db.write();
		req.send({ ok: true, message: "User registered successfully" });
	}
});

app.get("*", (req, res) => {
	res.sendFile(__dirname + "public/index.html");
});

app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
