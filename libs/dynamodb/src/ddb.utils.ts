export const toBuffer = (data: any) => {
  const json_data = JSON.stringify(data);
  return Buffer.from(json_data, 'utf8');
};

export const toObject = (buffer: any) => {
  const json_data = buffer.toString('utf8');
  return JSON.parse(json_data);
};

export const encodeBinaryWithBase64 = (data: any) => {
  const json_data = JSON.stringify(data);
  const buffer = Buffer.from(json_data, 'utf8');
  return buffer.toString('base64');
};

export const decodeBinaryWithBase64 = (base64Encoded: any) => {
  const buffer = Buffer.from(base64Encoded, 'base64');
  const json_data = buffer.toString('utf8');
  return JSON.parse(json_data);
};
