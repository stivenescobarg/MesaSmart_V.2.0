const Proveedor = require("../../models/Proveedor");

exports.crear = async (req, res) => {
  try {
    const { nombre, nit, telefono, correo, direccion, ciudad, categoria, observaciones } = req.body;
    if (!nombre?.trim())
      return res.status(400).json({ msg: "El nombre del proveedor es requerido." });

    const id = await Proveedor.crear({
      restaurante_id: req.restaurante_id,
      nombre, nit, telefono, correo, direccion, ciudad, categoria, observaciones,
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[proveedores/crear]", err);
    res.status(500).json({ msg: "Error al crear proveedor." });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { estado, categoria, busqueda } = req.query;
    const proveedores = await Proveedor.getAll({ restaurante_id: req.restaurante_id, estado, categoria, busqueda });
    res.json({ ok: true, proveedores });
  } catch (err) {
    console.error("[proveedores/getAll]", err);
    res.status(500).json({ msg: "Error al obtener proveedores." });
  }
};

exports.getById = async (req, res) => {
  try {
    const proveedor = await Proveedor.getById(req.params.id, req.restaurante_id);
    if (!proveedor) return res.status(404).json({ msg: "Proveedor no encontrado." });
    res.json({ ok: true, proveedor });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener proveedor." });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { nombre, nit, telefono, correo, direccion, ciudad, categoria, observaciones } = req.body;
    if (!nombre?.trim())
      return res.status(400).json({ msg: "El nombre del proveedor es requerido." });

    const existente = await Proveedor.getById(req.params.id, req.restaurante_id);
    if (!existente) return res.status(404).json({ msg: "Proveedor no encontrado." });

    await Proveedor.actualizar(req.params.id, req.restaurante_id, { nombre, nit, telefono, correo, direccion, ciudad, categoria, observaciones });
    res.json({ ok: true });
  } catch (err) {
    console.error("[proveedores/actualizar]", err);
    res.status(500).json({ msg: "Error al actualizar proveedor." });
  }
};

exports.cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!["activo", "inactivo"].includes(estado))
      return res.status(400).json({ msg: "Estado inválido." });

    const existente = await Proveedor.getById(req.params.id, req.restaurante_id);
    if (!existente) return res.status(404).json({ msg: "Proveedor no encontrado." });

    await Proveedor.cambiarEstado(req.params.id, req.restaurante_id, estado);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ msg: "Error al cambiar estado." });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const existente = await Proveedor.getById(req.params.id, req.restaurante_id);
    if (!existente) return res.status(404).json({ msg: "Proveedor no encontrado." });

    const conFacturas = await Proveedor.tieneFacturas(req.params.id);
    if (conFacturas)
      return res.status(409).json({ msg: "No se puede eliminar: el proveedor tiene facturas registradas. Desactívalo en su lugar." });

    await Proveedor.eliminar(req.params.id, req.restaurante_id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[proveedores/eliminar]", err);
    res.status(500).json({ msg: "Error al eliminar proveedor." });
  }
};