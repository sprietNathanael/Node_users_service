const winston = require("winston");
const sequelize = require("sequelize");

class Controller {

    /**
     *
     * @param {sequelize.Model} userModel
     * @param {winston.Logger} logger
     */
    constructor(userModel, logger) {
        logger.info("[Controller] Starting");
        this.userModel = userModel;
        this.logger = logger;
        logger.info("[Controller] Ready");
    }

    /**
     * Creates a new User
     * @param {String} lastname
     * @param {String} firstname
     * @param {String} username
     * @param {String} password
     * @param {Response} res
     */
    createUser(lastname, firstname, username, password, res){
        this.logger.info("[Controller] Creating User");

        if(this.checkUser(lastname, firstname, username, password)){
            this.userModel.create({
                lastname: lastname,
                firstname: firstname,
                username: username,
                password: password
            }).then((user) => {
                this.logger.info("[Controller] Ok, sending user !");
                res.status(201).send(user)
            });

        } else {
            this.logger.info("[Controller] Bad Request !");
            res.status(400).send({});
        }
    }

    /**
     * Check the validity of a user
     * @param {String} lastname
     * @param {String} firstname
     * @param {String} username
     * @param {String} password
     */
    checkUser(lastname, firstname, username, password){
        if((typeof username === "string" && username.match(/^[a-zA-Z0-9-_]+$/) != null) &&
		(typeof firstname === "string" && firstname.match(/^[a-zA-Z0-9-_]+$/) != null) &&
        (typeof lastname === "string" && lastname.match(/^[a-zA-Z0-9-_]+$/) != null) &&
        (typeof password === "string" && password !== "" && password.length >= 8))
		{
			return true;
		}
		else
		{
			return false;
		}
    }
}

module.exports = Controller;