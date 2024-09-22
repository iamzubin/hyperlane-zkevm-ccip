import express, { Express, Request, Response } from 'express';
import axios from 'axios';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port: number = 3000;

app.use(express.json());

const baseURL: string = process.env.BASE_URL || ''; // https://bridge-api.public.zkevm-test.net
const ISMAddress: string = process.env.ISM_ADDRESS || ''; // 0x22D0Cc772C6e87e6A952b675BB128CCF97B1A2d6

const merkleProofString: string = "/merkle-proof";
const getClaimsFromAcc: string = "/bridges/";

const functionAbi: string[] = [
  "bytes32[32] smtProofLocalExitRoot",
  "bytes32[32] smtProofRollupExitRoot",
  "uint256 globalIndex",
  "bytes32 mainnetExitRoot",
  "bytes32 rollupExitRoot",
  "uint32 originNetwork",
  "address originAddress",
  "uint32 destinationNetwork",
  "address destinationAddress",
  "uint256 amount",
  "bytes metadata"
];

interface Deposit {
  metadata: string;
  ready_for_claim: boolean;
  claim_tx_hash: string | null;
  deposit_cnt: number;
  orig_net: number;
  orig_addr: string;
  dest_net: number;
  dest_addr: string;
  amount: string;
}

interface PolygonDataResponse {
  deposits: Deposit[];
}

interface ProofResponse {
  proof: {
    merkle_proof: string[];
    main_exit_root: string;
    rollup_exit_root: string;
    rollup_merkle_proof: string[];
  };
}

app.post("/", async (req: Request, res: Response) => {
  try {
    const { data, sender } = req.body;

    const polygonResponse = await axios.get<PolygonDataResponse>(baseURL + getClaimsFromAcc + ISMAddress);
    const PolygonData = polygonResponse.data;

    const matchedDeposit = PolygonData.deposits.find(
      (deposit) => deposit.metadata === data
    );
    console.log("Matched Deposit:", PolygonData, matchedDeposit);
    if (!matchedDeposit) {
      res.status(404).send({ error: "Deposit not found" });
      return;
    }
    if (!matchedDeposit.ready_for_claim) {
      res.status(503).send({ error: "Deposit not ready for claim" });
      return;
    }

    if (matchedDeposit.claim_tx_hash) {
      res.status(503).send({ error: "Deposit already claimed" });
      return;
    }

    const proofResponse = await axios.get<ProofResponse>(baseURL + merkleProofString, {
      params: {
        deposit_cnt: matchedDeposit.deposit_cnt,
        net_id: matchedDeposit.orig_net,
      },
    });
    const proof = proofResponse.data.proof;

    const encodedABI = ethers.AbiCoder.defaultAbiCoder().encode(functionAbi, [
      proof.merkle_proof,
      proof.rollup_merkle_proof,
      matchedDeposit.deposit_cnt,
      proof.main_exit_root,
      proof.rollup_exit_root,
      matchedDeposit.orig_net,
      matchedDeposit.orig_addr,
      matchedDeposit.dest_net,
      matchedDeposit.dest_addr,
      matchedDeposit.amount,
      matchedDeposit.metadata,
    ]);

    console.log("Encoded ABI:", encodedABI);
    res.send({ data: encodedABI });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});