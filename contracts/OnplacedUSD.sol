// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title OnplacedUSD — an EIP-3009 test stablecoin for BSC testnet
 *
 * x402's `exact` scheme settles by having the payer sign an EIP-3009
 * `transferWithAuthorization` off-chain, which a facilitator then submits. That
 * requires a token implementing EIP-3009, and BSC testnet has none: the usual
 * test USDT/USDC there (0x337610…4dDd, 0x645449…8930) are plain BEP20 with no
 * 3009 and no 2612, and AEON's TESTU exists only on mainnet.
 *
 * So this exists purely to give the payment path a real asset to move on chain
 * 97. Verification and settlement are still performed by AEON's third-party
 * facilitator, which supports eip155:97 — only the token is ours.
 *
 * `mint` is deliberately unrestricted. This is a testnet faucet token with no
 * value; gating it would just add a step to every demo. NEVER deploy this to
 * mainnet.
 */
contract OnplacedUSD {
    string public constant name = "Onplaced USD";
    string public constant symbol = "oUSD";
    uint8 public constant decimals = 6;

    // EIP-712 domain version. x402 clients read this into the payment
    // requirements' `extra` field, so it must match what the server advertises.
    string public constant version = "2";

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /// @dev authorizer => nonce => used. EIP-3009 nonces are arbitrary bytes32,
    /// not sequential, so this is a set of spent values rather than a counter.
    mapping(address => mapping(bytes32 => bool)) private _authorizationStates;

    bytes32 private constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH = keccak256(
        "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
    );
    bytes32 private constant RECEIVE_WITH_AUTHORIZATION_TYPEHASH = keccak256(
        "ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
    );
    bytes32 private constant CANCEL_AUTHORIZATION_TYPEHASH =
        keccak256("CancelAuthorization(address authorizer,bytes32 nonce)");

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
    event AuthorizationCanceled(address indexed authorizer, bytes32 indexed nonce);

    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                block.chainid,
                address(this)
            )
        );
    }

    function authorizationState(address authorizer, bytes32 nonce) external view returns (bool) {
        return _authorizationStates[authorizer][nonce];
    }

    /// Testnet faucet. No access control on purpose — see the contract notice.
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "oUSD: allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    /**
     * EIP-3009. Anyone may submit a valid authorization — that is the whole
     * point: the payer never sends a transaction, the facilitator does.
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        _requireValidAuthorization(from, nonce, validAfter, validBefore);
        _requireValidSignature(
            from,
            keccak256(
                abi.encode(
                    TRANSFER_WITH_AUTHORIZATION_TYPEHASH, from, to, value, validAfter, validBefore, nonce
                )
            ),
            v,
            r,
            s
        );

        _markAuthorizationUsed(from, nonce);
        _transfer(from, to, value);
    }

    /**
     * Same as above but the caller must be the payee, which closes the
     * front-running hole where a third party submits someone else's
     * authorization to an unexpected recipient contract.
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(to == msg.sender, "oUSD: caller must be payee");
        _requireValidAuthorization(from, nonce, validAfter, validBefore);
        _requireValidSignature(
            from,
            keccak256(
                abi.encode(
                    RECEIVE_WITH_AUTHORIZATION_TYPEHASH, from, to, value, validAfter, validBefore, nonce
                )
            ),
            v,
            r,
            s
        );

        _markAuthorizationUsed(from, nonce);
        _transfer(from, to, value);
    }

    function cancelAuthorization(address authorizer, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)
        external
    {
        require(!_authorizationStates[authorizer][nonce], "oUSD: authorization used");
        _requireValidSignature(
            authorizer,
            keccak256(abi.encode(CANCEL_AUTHORIZATION_TYPEHASH, authorizer, nonce)),
            v,
            r,
            s
        );

        _authorizationStates[authorizer][nonce] = true;
        emit AuthorizationCanceled(authorizer, nonce);
    }

    function _transfer(address from, address to, uint256 value) private {
        require(to != address(0), "oUSD: zero address");
        uint256 balance = balanceOf[from];
        require(balance >= value, "oUSD: balance");
        balanceOf[from] = balance - value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    function _requireValidAuthorization(
        address authorizer,
        bytes32 nonce,
        uint256 validAfter,
        uint256 validBefore
    ) private view {
        require(block.timestamp > validAfter, "oUSD: authorization not yet valid");
        require(block.timestamp < validBefore, "oUSD: authorization expired");
        require(!_authorizationStates[authorizer][nonce], "oUSD: authorization used");
    }

    function _markAuthorizationUsed(address authorizer, bytes32 nonce) private {
        _authorizationStates[authorizer][nonce] = true;
        emit AuthorizationUsed(authorizer, nonce);
    }

    function _requireValidSignature(address signer, bytes32 structHash, uint8 v, bytes32 r, bytes32 s)
        private
        view
    {
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR(), structHash));

        // Reject the upper half of the curve order so a signature can't be
        // malleated into a second valid one for the same authorization. This is
        // secp256k1's n/2 — all 64 hex digits of it. Truncating the constant does
        // not weaken the check, it breaks it: a short value rejects almost every
        // legitimate signature, which is how this first failed against a real
        // facilitator.
        require(
            uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0,
            "oUSD: invalid signature s"
        );

        address recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0) && recovered == signer, "oUSD: invalid signature");
    }
}
