const net_re = /^([0-9.]*)\/(\d+)$/

function compact_children(parent) {
    const groups = [];
    const kids = Array.from(parent.children);
    if (!parent.children || (parent.children.length === 0)) {
        return;
    }

    let next_size = kids.length / 2;
    let group_bits = Math.log2(next_size);
    while (next_size > 1) {
        next_child = 0;
        next_group = 0;
        while (next_child < kids.length) {
            if ((next_group < groups.length) && (next_child === groups[next_group].idx)) {
                while ((next_group < groups.length) && (next_child === groups[next_group].idx)) {
                    next_child = next_child + groups[next_group].size;
                    next_group = next_group + 1;
                }
            } else {
                const check_type = kids[next_child].type;
                let ii;
                for (ii = 0; ii<next_size; ii++) {
                    if (kids[next_child + ii].type !== check_type) {
                        break;
                    }
                }
                if (ii === next_size) {
                    groups.splice(next_group, 0, {idx: next_child, size: next_size, bits: group_bits});
                    next_group = next_group + 1;
                }
                next_child = next_child + next_size;
            }
        }
        next_size = next_size / 2;
        group_bits = group_bits - 1;
    }

    for (grp of groups) {
        const target = kids[grp.idx];
        const match = net_re.exec(target.network);
        const run = kids.splice(grp.idx, grp.size, target);

        target.network = match[1] + "/" + (parseInt(match[2]) - grp.bits);
        target.ips = target.ips * grp.size;

	if (target.type !== "subnet") {
            target.children = run.map( child => child.children || [] ).reduce( (a, b) => a.concat(b) );
	}
    }

    parent.children = kids;
    for (child of kids) {
        if (child.type !== "subnet") {
            compact_children(child);
	}
    }
}
