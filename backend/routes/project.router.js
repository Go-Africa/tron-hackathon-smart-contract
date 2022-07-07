const router = require("express").Router();
const ProjectController = require("../controllers/project.controller");

/* get All project instance */
router.get("/all", ProjectController.getAllProjects);

/* Create a project instance */
router.post("/create", ProjectController.createproject);

/* Get a project simple details by id */
router.get("/:id", ProjectController.getProjectById);

/* Get all project details by address */
router.get("/details/:address", ProjectController.getAllProjectDetails);

/* Verify if user is an investor */
router.get("/check/:address/:user/:hash", ProjectController.checkTransactionHash);

/* Get project contributions */
router.get("/:address/contribs", ProjectController.getProjectContributions);

/* Get project cashIns */
router.get("/:address/cashins", ProjectController.getProjectCashIns);

/* Get project cashOuts */
router.get("/:address/cashouts", ProjectController.getProjectCashOuts);

/* Make a cashIn */
router.post("cashin/:address", ProjectController.addCashIn);

/* Make a cashOut */
router.post("cashout/:address", ProjectController.sendCashOut);

/* Set project state */
router.get("/:address/state", ProjectController.setProjectState);

/* Set project scheduler */
router.post("/schedule/:address/:id", ProjectController.setProjectState);


module.exports = router;
