// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing SafeMath Implementation
import "./tron/SafeMath.sol";

// ITRC-20 contract
import "./tron/ITRC20.sol";

contract Project {
    using SafeMath for uint256;

    /* 
    *   Data type: Enum (ProjectState)
    *   Refer to all available project's states
    */
    enum ProjectState {
        Fundraising,
        Ready,
        Closed
    }

    /* 
    *   Data Structure: Investment
    *   Take date, amount, email address and the investor address
    */
    struct Investment {
        string investDate;
        uint256 userId;
        string email;
        address investorAddress;
        uint256 amount;
    }

    /* 
    *   Data Structure: CashIn
    *   Usage: When the project receive some money 
    *   Take date, Sender address, Reason of sending and the amount sent
    */
    struct CashIn {
        string cashInDate;
        address senderAddress;
        string reasonOfSending;
        uint256 amount;
    }

    /* 
    *   Data Structure: CashOut
    *   Usage: When we remove a specifuc amount inside project balance 
    *   Take date, Receiver address, Reason of sending and the amount sent
    */
    struct CashOut {
        string cashOutDate;
        address receiverAddress;
        string reasonOfSending;
        uint256 amount;
    }

    /*
    *   All Project variable
    *   state: to manage project state (set default to Fundraising)
    *   trxToken: An interface of TRC20 (use to make transfert of token between addresses)
    *   goalAmount: the project goalAmount
    *   currentBalance: to current balance of the project
    *   ref: The project reference or project Id (helpfull while trying to get project details using only ref number)
    *   title: Project title
    *   investments: List of all investments
    *   cashins: List of all Project's CashIn
    *   cashOut: List of all Project's cashOut
    */
    ProjectState public state = ProjectState.Fundraising;
    ITRC20 private trxToken;
    address payable public projectCreator;
    uint256 public goalAmount;
    uint256 public currentBalance;
    uint256 public ref;
    string public title;
    uint256 public cycleDeadline = 0;
    Investment[] investments;
    CashIn[] cashins;
    CashOut[] cashouts;

    /* Modifier to check project state before some request */
    modifier inState(ProjectState _state) {
        require(state == _state, "The project goal amount is already reached");
        _;
    }

    /* Event while receiving funds */
    event ReceivedFunding(
        address investor,
        uint256 amount,
        uint256 currentTotal
    );

    /* Project constructor */
    constructor(
        ITRC20 token,
        address payable creator,
        uint256 projectRef,
        uint256 projectGoalAmount,
        string memory projectTitle
    ) {
        trxToken = token;
        projectCreator = creator;
        goalAmount = projectGoalAmount;
        currentBalance = 0;
        ref = projectRef;
        title = projectTitle;
    }

    /* 
    *   Create and append a cashOut in cashouts array
    */
    function cashOut(string calldata cashOutDate, address receiverAddress, string calldata sendingReason, uint256 amount)
        external
        returns (bool result)
    {
        require(msg.sender == projectCreator, "Only project creator can make a cashout"); /* Only project creator can make a cashout */
        require(amount <= currentBalance, "You can remove more than current balance"); /* User can remove all or a part of the project balance */

        if (trxToken.transfer(payable(receiverAddress), amount)) {
            currentBalance = currentBalance.sub(amount);
            cashouts.push(CashOut(cashOutDate, receiverAddress, sendingReason, amount));
            return true;
        }

        return false;
    }

    /* 
    *   Create and append a cashIn in cashins array
    */
    function cashIn(string calldata cashInDate, address senderAddress, string calldata receivingReason, uint256 amount)
        external
        returns (bool result)
    {
        require(msg.sender == projectCreator);
        require(amount > 0);
        
        currentBalance = currentBalance.add(amount);
        cashins.push(CashIn(cashInDate, senderAddress, receivingReason, amount));
        emit ReceivedFunding(msg.sender, amount, currentBalance);
        return true;
    }

    /* Get all project cashins */
    function getCashIns() external view returns (CashIn[] memory) {
        return cashins;
    }

    /* Get all project cashout */
    function getCashOuts() external view returns (CashOut[] memory) {
        return cashouts;
    }

    /* Curent project amount */
    function getCurrentbalance() public view returns (uint256) {
        return currentBalance;
    }

    /* Get goal amount of the project */
    function getGoalBalance() public view returns (uint256) {
        return goalAmount;
    }

    /* Get project reference number */
    function getReference() public view returns (uint256) {
        return ref;
    }

    /* 
    *   Set Project reference number
    *   Only the project creator can make this request
    */
    function setReference(uint256 referenceProject) external {
        require(msg.sender == projectCreator);

        ref = referenceProject;
    }

    /* get The project title */
    function getTitle() public view returns (string memory) {
        return title;
    }

    /* 
    *   Set Project title
    *   Only the project creator can make this request
    */
    function setTitle(string calldata _title) external {
        require(msg.sender == projectCreator);
        title = _title;
    }

    /* 
    *   Get Project contributions
    *   Return all investments, the current project amount and the goal amount
    */
    function getContributions() external view returns (Investment[] memory invests, uint256 currentAmount, uint256 goal) {
        return (investments, currentBalance, goalAmount);
    }

    /* 
    *   Invest to a project
    *   The request takes effect only when the project state is Fundraising
    *   and the new currentBalance is less than or equal to goalAmount
    */
    function invest(
        string calldata investDate,
        uint256 userId,
        uint256 amount,
        string calldata emailAddress
    ) external payable inState(ProjectState.Fundraising) returns(bool) {
        require(
            (currentBalance + amount) <= goalAmount,
            "The amount is too big !"
        );
        trxToken.transferFrom(msg.sender, address(this), amount);

        investments.push(Investment(investDate, userId, emailAddress, msg.sender, amount));
        currentBalance = currentBalance.add(amount);

        checkIfComplete();
        emit ReceivedFunding(msg.sender, amount, currentBalance);
        return true;
    }

    /* 
    *   Add part to a project (The same user could add it's investment)
    *   The request takes effect only when the project state is Fundraising,
    *   The current address already make and investment
    *   and the new currentBalance is less than or equal to goalAmount
    */
    function addPart(uint256 amount)
        external
        payable
        inState(ProjectState.Fundraising)
        returns(bool)
    {
        require(
            (currentBalance + amount) <= goalAmount,
            "The amount is too big !"
        );
        Investment[] memory invests = investments;
        bool find = false;
        uint256 pos;

        for (uint256 i = 0; i < invests.length; i++) {
            if ((invests[i].investorAddress == msg.sender)) {
                find = true;
                pos = i;
                break;
            }
        }

        if (find) {
            trxToken.transferFrom(msg.sender, address(this), amount);
            investments[pos].amount = investments[pos].amount.add(amount);
            currentBalance = currentBalance.add(amount);

            checkIfComplete();
            emit ReceivedFunding(msg.sender, amount, currentBalance);
            return true;
        }
        return false;
    }

    /*
    *   Check if the goalAmount is reached and change the project state
    */
    function checkIfComplete() public {
        if(currentBalance >= goalAmount) {
            state = ProjectState.Ready;
        }
    }

    /* 
    *   Set Project state
    *   Only project creator can make this request
    *   By Default : 
    *   0 => Fundraising; 1 => Ready and 2 => Closed
    */
    function setState(uint256 stateNumber) external {
        require(msg.sender == projectCreator);
        if (stateNumber == 0) {
            state = ProjectState.Fundraising;
        } else if (stateNumber == 1) {
            state = ProjectState.Ready;
        } else {
            state = ProjectState.Closed;
        }
    }

    /*
    *   Get all Project's details
    */
    function getDetails()
        public
        view
        returns (
            address payable creator,
            uint256 projectRef,
            string memory projectTitle,
            ProjectState currentState,
            uint256 projectGoalAmount,
            uint256 currentAmount,
            Investment[] memory investmentss,
            CashIn[] memory cashinss,
            CashOut[] memory cashoutss
        )
    {
        creator = projectCreator;
        projectRef = ref;
        projectTitle = title;
        currentState = state;
        projectGoalAmount = goalAmount;
        currentAmount = currentBalance;
        investmentss = investments;
        cashinss = cashins;
        cashoutss = cashouts;
    }

    /*
    *  Transfert money to investor address
    *  this method is called by a scheduler who takes all the project
    *   investments and send them their income  
    *   Only project creator can make this request 
    */
    function sendIncome(address investorAddress, uint256 amount)
        external
        returns (bool result)
    {
        require(
            msg.sender == projectCreator,
            "You are not allowed to send money !"
        );
        require(currentBalance > 0, "No more money");

        if (trxToken.transfer(investorAddress, amount)) {
            currentBalance = currentBalance.sub(amount);
            return true;
        }

        return false;
    }

    /*
    *  Check If userId is present inside investments list
    *   return true or false 
    */
    function checkIfInvestor(uint256 _userId)
        public
        view
        returns (bool result)
    {
        for (uint256 i = 0; i < investments.length; i++) {
            if ((investments[i].userId == _userId)) {
                return true;
            }
        }
        return false;
    }
}
