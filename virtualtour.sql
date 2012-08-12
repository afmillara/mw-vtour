
CREATE TABLE /*_*/virtualtour (
	vtour_pageid int unsigned NOT NULL default 0,
	vtour_tourid varchar(255) binary NOT NULL default '',
	vtour_hash binary(20) NOT NULL default '',
	vtour_coord0 double,
	vtour_coord1 double,
	PRIMARY KEY( vtour_pageid, vtour_tourid )
) /*wgDBTableOptions*/;

CREATE INDEX /*i*/vtour_pageid ON /*_*/virtualtour ( vtour_pageid );

