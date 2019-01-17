const UserUtils = require('./userUtils');

const jwt = require('jsonwebtoken');
const passphrase = 'thisisapassphrase';
const expDays = 15;

class Controller {

	/**
	 *
	 * @param {sequelize.Model} userModel
	 * @param {winston.Logger} logger
	 */
	constructor(userModel, logger) {
		logger.info('[Controller] Starting');
		this.userModel = userModel;
		this.logger = logger;
		this.userUtils = new UserUtils(this.logger);
		logger.info('[Controller] Ready');
	}

	/**
	 * Get all users
	 */
	getUsers() {
		return this.userModel.findAll().then((users) => {
			let usersToSend = [];
			for (let user of users) {
				let userInter = Object.assign(user.get());

				// Remove hidden attributes
				delete userInter.password;
				delete userInter.createdAt;
				delete userInter.updatedAt;

				usersToSend.push(userInter);
			}
			return usersToSend;
		});
	}

	/**
	 * Get one user by id
	 * @param {Integer} id
	 */
	getUserById(id) {

		// If the id is not correct
		if (typeof id !== 'number') {
			throw new TypeError(`${typeof id} is not a number`);
		}

		this.logger.info('[Controller] Get user by id %d', id);
		return this.userModel.findByPk(id).then((user) => {
			let userInter = null;
			if (user !== null) {
				userInter = Object.assign(user.get());

				// Remove hidden attributes
				delete userInter.password;
				delete userInter.createdAt;
				delete userInter.updatedAt;
			}
			return userInter;
		});
	}

	/**
	 * Creates a new User
	 * @param {String} lastname
	 * @param {String} firstname
	 * @param {String} username
	 * @param {String} password
	 */
	createUser(lastname, firstname, username, password) {
		this.logger.info('[Controller] Creating User');

		// Check the validity of user
		let userCheck = this.userUtils.checkUserFormatMandatory(lastname, firstname, username, password);

		// If there are not validity errors
		if (userCheck === '') {


			return this.userModel.create({
				lastname: lastname,
				firstname: firstname,
				username: username,
				password: password
			}).then((user) => {

				this.logger.info('[Controller] Ok, sending user !');
				let userInter = null;

				// If the user has correctly been added
				if (user !== null) {
					userInter = Object.assign(user.get());

					// Remove hidden attributes
					delete userInter.password;
					delete userInter.createdAt;
					delete userInter.updatedAt;
				}

				return userInter;

			// If the username already exists
			}).catch((error) => {

				this.logger.info('[Controller] Bad Request !');
				this.logger.error(error);
				throw (new Error('Username already exists'));
			});

		// If there is a validity error
		} else {
			this.logger.info('[Controller] Bad Request !');
			return new Promise((resolve, reject) => {
				reject(new Error(`Wrong ${userCheck}`));
			});
		}
	}


	/**
	 * Update a User
	 * @param {Integer} id
	 * @param {String} lastname
	 * @param {String} firstname
	 * @param {String} username
	 * @param {String} password
	 * @param {Integer} adminPermission
	 */
	updateUser(id, lastname, firstname, username, password, adminPermission) {

		this.logger.info('[Controller] Updating User');

		// Check the validity of user
		if (typeof id !== 'number') {
			throw new TypeError(`${typeof id} is not a number`);
		}
		if (adminPermission !== undefined && typeof adminPermission !== 'number') {
			throw new TypeError(`adminPermission is wrong : ${typeof adminPermission} is not a number`);
		}

		let userCheck = this.userUtils.checkUserFormat(lastname, firstname, username, password);

		// If there are no validity error
		if (userCheck === '') {

			return this.userModel.findByPk(id).then(user => {

				// If the user is found
				if (user !== null) {

					return user.update({
						lastname: lastname,
						firstname: firstname,
						username: username,
						password: password,
						adminPermission: adminPermission
					}).then((user) => {

						this.logger.info('[Controller] Ok, sending user !');
						let userInter = null;

						// If the user has correctly been updated
						if (user !== null) {
							userInter = Object.assign(user.get());

							// Remove hidden attributes
							delete userInter.password;
							delete userInter.createdAt;
							delete userInter.updatedAt;
						}
						return userInter;

					// If the username already exists
					}).catch((error) => {
						this.logger.info('[Controller] Bad Request !');
						this.logger.error(error);
						throw (new Error('Username already exists'));
					});

				// If the user already exists
				} else {
					return null;
				}
			});

		// If there is a validity error
		} else {
			this.logger.info('[Controller] Bad Request !');
			return new Promise((resolve, reject) => {
				reject(new Error(`Wrong ${userCheck}`));
			});
		}
	}

	/**
	 * Delete a user
	 * @param {Integer} id
	 */
	deleteUser(id) {

		// Check the validity
		if (typeof id !== 'number') {
			throw new TypeError(`${typeof id} is not a number`);
		}

		this.logger.info('[Controller] Deleting User %s', id);

		return this.userModel.findByPk(id).then(user => {

			// If the user has been found
			if (user !== null) {
				return user.destroy().then(() => {
					this.logger.info('[Controller] Ok, user deleted !');
					return true;
				});
			// If the user does not exists
			} else {
				this.logger.error('[Controller] User %s does not exists', id);
				return new Promise((resolve, reject) => {
					reject(new Error('User does not exist'));
				});
			}
		});
	}

	/**
	 * Try to login with a a username and a password
	 * @param {String} username Username that tries to login
	 * @param {String} password Password to try to login with
	 */
	login(username, password) {

		// Check the validity
		if (typeof username !== 'string') {
			throw new TypeError(`username is wrong : ${typeof username} is not a string`);
		}
		if (typeof password !== 'string') {
			throw new TypeError(`password is wrong : ${typeof firstname} is not a string`);
		}

		return this.userModel.findOne({
			where: {
				username: username,
				password: password
			}
		}).then(user => {

			// If the user exists
			if (user !== null) {
				// Create a new token
				let token = jwt.sign({
					exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * expDays),
					jwtid: Math.random().toString(),
				}, passphrase);

				return user.createToken({
					token: token
				}).then(() => {
					let userToSend = Object.assign(user.get(), {
						token: token
					});

					// Remove hidden attributes
					delete userToSend.password;
					delete userToSend.createdAt;
					delete userToSend.updatedAt;
					let userToReturn = Object.assign(user, {
						token: token
					});
					return userToReturn;
				});
			// If the user does not exist
			} else {
				return null;
			}
		});
	}

	/**
	 * Try to logout with a username and a token
	 * @param {String} username Username that wants to login
	 * @param {String} token Token that wants to logout
	 */
	logout(username, token) {

		// Check the validity
		if (typeof username !== 'string') {
			throw new TypeError(`${typeof username} is not a string`);
		}
		if (typeof token !== 'string') {
			throw new TypeError(`${typeof token} is not a string`);
		}

		return this.userModel.findOne({
			where: {
				username: username
			}
		}).then(user => {

			// If the user exists
			if (user !== null) {

				return user.getTokens({
					where: {
						token: token
					}
				}).then((tokenRes) => {

					// If the token exists
					if (tokenRes.length === 1) {
						return tokenRes[0].destroy().then(() => {
							return true;
						});

					// If the token does not exist
					} else {
						return new Promise((resolve, reject) => {
							reject(new Error('Token does not exist'));
						});
					}
				});

			// If the user does not exist
			} else {
				return new Promise((resolve, reject) => {
					reject(new Error('User does not exist'));
				});
			}
		});
	}

	/**
	 * Try a token
	 * @param {String} username Username to try
	 * @param {String} token Token to try
	 */
	tryToken(username, token) {

		// Check the validity
		if (typeof username !== 'string') {
			throw new TypeError(`${typeof id} is not a string`);
		}
		if (typeof token !== 'string') {
			throw new TypeError(`${typeof id} is not a string`);
		}

		return this.userModel.findOne({
			where: {
				username: username
			}
		}).then(user => {

			// If the user exists
			if (user !== null) {

				// Check the token
				try {
					jwt.verify(token, passphrase);

					return user.getTokens({
						where: {
							token: token
						}
					}).then((tokenRes) => {

						//If the token exists
						if (tokenRes.length === 1) {
							return true;

						// If the token does not exist
						} else {
							return false;
						}
					});

				// If the token is wrong
				} catch (error) {
					let errorToReturn;
					if (error instanceof jwt.TokenExpiredError) {
						errorToReturn = new Error('Token has expired');
					} else if (error instanceof jwt.JsonWebTokenError) {
						errorToReturn = new Error('Token is invalid');
					} else {
						errorToReturn = new Error();
					}
					return new Promise((resolve, reject) => {
						reject(errorToReturn);
					});
				}

			// If the user does not exist
			} else {
				return null;
			}
		});
	}

}

module.exports = Controller;