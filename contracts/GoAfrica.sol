// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

// Importing SafeMath Implementation
import "./tron/SafeMath.sol";

// ITRC-20 contract
import "./tron/ITRC20.sol";

// Import Project Contract
import "./Project.sol";

contract GoAfrica {
    using SafeMath for uint256;

    /* List of all the project in the contract */
    Project[] public projects;

    /* Event when new project is created */
    event ProjectStarted(
        address contractAddress,
        address projectCreator,
        uint256 ref,
        string title,
        uint256 goalAmount
    );

    /* Get project detail by Ref */
    function getProjectByRef(uint256 projectRef)
        external
        view
        returns (
            Project proj,
            uint256 ref,
            uint256 goalAmount,
            uint256 currentAmount,
            string memory title
        )
    {
        for (uint256 i = 0; i < projects.length; i++) {
            proj = Project(projects[i]);
            if (proj.getReference() == projectRef) {
                return (
                    proj,
                    proj.getReference(),
                    proj.getGoalBalance(),
                    proj.getCurrentbalance(),
                    proj.getTitle()
                );
            }
        }
        return (proj, ref, goalAmount, currentAmount, title); /* Return all type default value */
    }

    /* get a project address */
    function getprojectAddress(uint256 projectRef)
        external
        view
        returns (Project project)
    {
        for (uint256 i = 0; i < projects.length; i++) {
            project = Project(projects[i]);
            if (project.getReference() == projectRef) {
                return project;
            }
        }
        return project;
    }

    /*
     *   Create a new Project and return it
     */
    function createProject(
        ITRC20 trxToken,
        uint256 projectRef,
        uint256 projectGoalAmount,
        string calldata projectTitle
    ) external returns (Project) {
        Project project = new Project(
            trxToken,
            payable(msg.sender),
            projectRef,
            projectGoalAmount,
            projectTitle
        );

        projects.push(project);
        emit ProjectStarted(
            address(project),
            msg.sender,
            projectRef,
            projectTitle,
            projectGoalAmount
        );

        return project;
    }

    /* Return all project addresses */
    function returnProjectsAddresses()
        external
        view
        returns (Project[] memory)
    {
        return projects;
    }
}
