"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toKonfigurasiResponse = toKonfigurasiResponse;
exports.mergeEffective = mergeEffective;
function toKonfigurasiResponse(data) {
    return {
        gajiPerJam: data.gajiPerJam,
        batasJedaMenit: data.batasJedaMenit,
        jedaOtomatisAktif: data.jedaOtomatisAktif,
    };
}
function mergeEffective(globalCfg, overrideCfg, username) {
    const effective = {
        gajiPerJam: overrideCfg?.gajiPerJam ?? globalCfg.gajiPerJam,
        batasJedaMenit: overrideCfg?.batasJedaMenit ?? globalCfg.batasJedaMenit,
        jedaOtomatisAktif: overrideCfg?.jedaOtomatisAktif ?? globalCfg.jedaOtomatisAktif,
    };
    const sources = {
        global: {
            gajiPerJam: globalCfg.gajiPerJam,
            batasJedaMenit: globalCfg.batasJedaMenit,
            jedaOtomatisAktif: globalCfg.jedaOtomatisAktif,
        },
    };
    if (overrideCfg) {
        const ov = {};
        if (overrideCfg.gajiPerJam != null)
            ov.gajiPerJam = overrideCfg.gajiPerJam;
        if (overrideCfg.batasJedaMenit != null)
            ov.batasJedaMenit = overrideCfg.batasJedaMenit;
        if (overrideCfg.jedaOtomatisAktif != null)
            ov.jedaOtomatisAktif = overrideCfg.jedaOtomatisAktif;
        if (Object.keys(ov).length > 0)
            sources.override = ov;
    }
    return {
        scope: overrideCfg ? "USER" : "GLOBAL",
        username,
        effective,
        sources,
    };
}
