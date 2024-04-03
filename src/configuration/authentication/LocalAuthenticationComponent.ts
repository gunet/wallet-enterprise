import { NextFunction, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { AuthenticationComponent } from "../../authentication/AuthenticationComponent";
import AppDataSource from "../../AppDataSource";
import { AuthorizationServerState } from "../../entities/AuthorizationServerState.entity";
import locale from "../locale";
import { UserAuthenticationMethod } from "../../types/UserAuthenticationMethod.enum";




export class LocalAuthenticationComponent extends AuthenticationComponent {

	constructor(
		override identifier: string,
		override protectedEndpoint: string,
		private users = [{ username: "user1", password: "secret", taxis_id: "432432432423", ssn: '032429484252432', firstName: 'John', lastName: 'Doe' }, { username: "user2", password: "secret", taxis_id: "432432432424", ssn: "032429484252433", firstName: 'Jane', lastName: 'Duffy' }]
	) { super(identifier, protectedEndpoint) }

	public override async authenticate(
		req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
		res: Response<any, Record<string, any>>,
		next: NextFunction) {
		
		return super.authenticate(req, res, async () => {
			if (await this.isAuthenticated(req)) {
				return next();
			}
	
			if (req.authorizationServerState.authenticationMethod &&
				req.authorizationServerState.authenticationMethod != UserAuthenticationMethod.SSO) {
					
				return next();
			}
			if (req.method == "POST") {
				return this.handleLoginSubmission(req, res);
			}
	
			return this.renderLogin(req, res);
		})
		.catch(() => {
			return next();
		});
	}


	
	private async isAuthenticated(req: Request): Promise<boolean> {
		if (!req.session.authenticationChain?.localAuthenticationComponent?.username) {
			return false;
		}
		const username = req.session.authenticationChain.localAuthenticationComponent.username;
		if (!username || this.users.filter(u => u.username == username).length != 1) return false;

		const usersFound = this.users.filter(u => u.username == username);
		req.authorizationServerState.ssn = usersFound[0].ssn;
		req.authorizationServerState.taxis_id = usersFound[0].taxis_id;
		req.authorizationServerState.firstName = usersFound[0].firstName;
		req.authorizationServerState.lastName = usersFound[0].lastName;
		await AppDataSource.getRepository(AuthorizationServerState).save(req.authorizationServerState);
		return true;
	}

	private async renderLogin(req: Request, res: Response): Promise<any> {
		res.render('issuer/login', {
			title: "Login1",
			lang: req.lang,
			locale: locale[req.lang]
		})
	}

	private async handleLoginSubmission(req: Request, res: Response): Promise<any> {
		const { username, password } = req.body;
		const usersFound = this.users.filter(u => u.username == username && u.password == password);
		if (usersFound.length == 1) {
			// sign a token and send it to the client

			req.session.authenticationChain.localAuthenticationComponent = {
				username: username
			};

			req.authorizationServerState.ssn = usersFound[0].ssn;
			req.authorizationServerState.taxis_id = usersFound[0].taxis_id;
			req.authorizationServerState.firstName = usersFound[0].firstName;
			req.authorizationServerState.lastName = usersFound[0].lastName;
			await AppDataSource.getRepository(AuthorizationServerState).save(req.authorizationServerState);
			return res.redirect(this.protectedEndpoint);
		}
		else {
			return this.renderLogin(req, res);
		}
	}
}


