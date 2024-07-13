import { bytesToHex, keccak256, padLeft } from './utils';

/**
 * Returns true if the bloom is a valid bloom
 * @param bloom The bloom
 */
export function isBloom(bloom: string): boolean {
  if (typeof bloom !== 'string') {
    return false;
  }

  if (!/^(0x)?[0-9a-f]{512}$/i.test(bloom)) {
    return false;
  }

  if (
    /^(0x)?[0-9a-f]{512}$/.test(bloom) ||
    /^(0x)?[0-9A-F]{512}$/.test(bloom)
  ) {
    return true;
  }

  return false;
}

export function isBloomAllSetInPositions(bloom: string, bitPositions: number[]): boolean {
  const bloomLengthMinusOne = bloom.length - 1;

  for (let i = 0; i < bitPositions.length; i++) {
    const bitpos = bitPositions[i];
    // test if bitpos in bloom is active
    const code = codePointToInt(
        bloom.charCodeAt(bloomLengthMinusOne - Math.floor(bitpos / 4)),
    );
    const offset = 1 << (bitpos % 4);

    if ((code & offset) !== offset) {
      return false;
    }
  }
  return true;
}

export function calculateBitPositions(value: string | Uint8Array): number[] {
  if (typeof value === 'object' && value.constructor === Uint8Array) {
    value = bytesToHex(value);
  }
  const hash = keccak256(value).replace('0x', '');
  const bitPoss = []  ;
  for (let i = 0; i < 12; i += 4) {
    // calculate bit position in bloom filter that must be active
    const bitpos =
        ((parseInt(hash.substr(i, 2), 16) << 8) +
            parseInt(hash.substr(i + 2, 2), 16)) &
        2047;
    bitPoss.push(bitpos);
  }
  return bitPoss;
}
/**
 * Returns true if the value is part of the given bloom
 * note: false positives are possible.
 * @param bloom encoded bloom
 * @param value The value
 */
export function isInBloom(bloom: string, value: string | Uint8Array): boolean {
  const bitPositions = calculateBitPositions(value);
  return isBloomAllSetInPositions(bloom, bitPositions);
}

/**
 * Code points to int
 * @param codePoint The code point
 */
function codePointToInt(codePoint: number): number {
  if (codePoint >= 48 && codePoint <= 57) {
    /* ['0'..'9'] -> [0..9] */
    return codePoint - 48;
  }

  if (codePoint >= 65 && codePoint <= 70) {
    /* ['A'..'F'] -> [10..15] */
    return codePoint - 55;
  }

  if (codePoint >= 97 && codePoint <= 102) {
    /* ['a'..'f'] -> [10..15] */
    return codePoint - 87;
  }

  throw new Error('invalid bloom');
}

/**
 * Returns true if the ethereum users address is part of the given bloom.
 * note: false positives are possible.
 * @param bloom encoded bloom
 * @param address the address to test
 */
export function isUserEthereumAddressInBloom(
  bloom: string,
  ethereumAddress: string,
): boolean {
  if (!isBloom(bloom)) {
    throw new Error('Invalid bloom given');
  }

  if (!isAddress(ethereumAddress)) {
    throw new Error(`Invalid ethereum address given: "${ethereumAddress}"`);
  }

  // you have to pad the ethereum address to 32 bytes
  // else the bloom filter does not work
  // this is only if your matching the USERS
  // ethereum address. Contract address do not need this
  // hence why we have 2 methods
  // (0x is not in the 2nd parameter of padleft so 64 chars is fine)
  const address = padLeft(ethereumAddress, 64);

  return isInBloom(bloom, address);
}

/**
 * Returns true if the contract address is part of the given bloom.
 * note: false positives are possible.
 * @param bloom encoded bloom
 * @param contractAddress the contract address to test
 */
export function isContractAddressInBloom(
  bloom: string,
  contractAddress: string,
): boolean {
  if (!isBloom(bloom)) {
    throw new Error('Invalid bloom given');
  }

  if (!isAddress(contractAddress)) {
    throw new Error(`Invalid contract address given: "${contractAddress}"`);
  }

  return isInBloom(bloom, contractAddress);
}

/**
 * Returns true if the topic is part of the given bloom.
 * note: false positives are possible.
 * @param bloom encoded bloom
 * @param topic the topic encoded hex
 */
export function isTopicInBloom(bloom: string, topic: string): boolean {
  if (!isBloom(bloom)) {
    throw new Error('Invalid bloom given');
  }

  if (!isTopic(topic)) {
    throw new Error('Invalid topic');
  }

  return isInBloom(bloom, topic);
}

/**
 * Checks if its a valid topic
 * @param topic encoded hex topic
 */
export function isTopic(topic: string): boolean {
  if (typeof topic !== 'string') {
    return false;
  }

  if (!/^(0x)?[0-9a-f]{64}$/i.test(topic)) {
    return false;
  } else if (
    /^(0x)?[0-9a-f]{64}$/.test(topic) ||
    /^(0x)?[0-9A-F]{64}$/.test(topic)
  ) {
    return true;
  }

  return false;
}

/**
 * Is valid address
 * @param address The address
 */
export function isAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false;
  }

  if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
    return true;
  }

  if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
    return true;
  }

  return false;
}
