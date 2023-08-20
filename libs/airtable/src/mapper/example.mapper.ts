export interface Example {
  name: string;
  phone: string;
  birth: string;
}

export class ExampleMapper {
  static toExample(req: Partial<Example>) {
    return {
      fldjqMpXKjbIJtoR3: req.name,
      fldAxrOIY6iMUvT7i: req.phone,
      fldnx3c62bvm2vsdY: req.birth,
    };
  }
}
