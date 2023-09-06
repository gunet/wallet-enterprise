import { Router } from "express";
import { verifierPanelAuthChain } from "../configuration/authentication/authenticationChain";
import locale from "../locale";
import { Repository } from "typeorm";
import AppDataSource from "../AppDataSource";
import { VerifiablePresentationEntity } from "../entities/VerifiablePresentation.entity";
import { appContainer } from "../services/inversify.config";
import { TYPES } from "../services/types";
import { VerifierConfigurationInterface } from "../services/interfaces";
import base64url from "base64url";



const verifierRouter = Router();
const verifiablePresentationRepository: Repository<VerifiablePresentationEntity> = AppDataSource.getRepository(VerifiablePresentationEntity);
const verifierConfiguration = appContainer.get<VerifierConfigurationInterface>(TYPES.VerifierConfigurationServiceInterface);


verifierPanelAuthChain.components.map(c => {
	verifierRouter.use(async (req, res, next) => {
		c.authenticate(req, res, next)
	});
})


verifierRouter.get('/', async (req, res) => {
	
	return res.render('verifier/definitions.pug', {
		lang: req.lang,
		presentationDefinitions: verifierConfiguration.getPresentationDefinitions(),
		locale: locale[req.lang]
	})
})


verifierRouter.get('/filter/by/definition/:definition_id', async (req, res) => {
	const definition_id = req.params.definition_id;
	if (!definition_id) {
		return res.status(500).send({ error: "No definition id was specified" });
	}
	const verifiablePresentations = await verifiablePresentationRepository.createQueryBuilder('vp')
		.where("vp.presentation_definition_id = :definition_id", { definition_id: definition_id })
		.getMany();
	return res.render('verifier/presentations.pug', {
		lang: req.lang,
		verifiablePresentations: verifiablePresentations,
		locale: locale[req.lang]
	})
})


verifierRouter.get('/presentation/:presentation_id', async (req, res) => {
	const presentation_id = req.params.presentation_id;
	if (!presentation_id) {
		return res.status(500).send({ error: "No presentation_id was specified" });
	}
	const verifiablePresentation = await verifiablePresentationRepository.createQueryBuilder('vp')
		.where("vp.id = :presentation_id", { presentation_id: presentation_id })
		.getOne();
	
	if (!verifiablePresentation || !verifiablePresentation.raw_presentation) {
		return res.status(400).render('error', {
			msg: "Verifiable presentation not found",
			lang: req.lang,
			locale: locale[req.lang]
		});
	}

	const payload = JSON.parse(base64url.decode(verifiablePresentation.raw_presentation?.split('.')[1])) as any;
	const vcList = payload.vp.verifiableCredential as string[];
	const credentialList = [];
	for (const vc of vcList) {
		const vcPayload = JSON.parse(base64url.decode(vc.split('.')[1])) as any;
		credentialList.push(vcPayload.vc);
	}

	// TODO: construct view based on the raw presentation, presentation submission and presentation definition
	const view = [ { name: "First name", value: "Dokimastikos" } ];

	return res.render('verifier/detailed-presentation.pug', {
		view: view,
		status: verifiablePresentation.status,
		lang: req.lang,
		locale: locale[req.lang]
	})
})

export { verifierRouter };