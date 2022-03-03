package com.weisong.backend.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.*;
import com.weisong.backend.entities.User;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Map;


/**
 * @author 李伟松
 * @create 2022-02-16-21:17
 */
@Mapper
@Repository
public interface UserMapper{

    //    注册/添加User                    ,gender,birth        ,#{gender},#{birth}
//    @Insert("insert into user(uuid,name,password,email) values(#{uuid},#{name},#{password},#{email})")
    void insertUser(@Param("uuid")String uuid,@Param("name")String name, @Param("password")String password,@Param("email")String email , @Param("gender")Integer gender, @Param("birth")Date birth);

    //    通过UUId 注销/删除User
//    @Delete("delete from user where uuid=#{uuid}")
    void deleteUserById(@Param("uuid") String uuid);

    //     上传头像
//    @Update("UPDATE user SET head_portrait =#{headPortrait} WHERE uuid = #{uuid}")
    void uploadHeadPortrait(@Param("uuid")String uuid,@Param("head_portrait")String headPortrait);

    //      检查User的name是否有重名
//    @Select("SELECT COUNT(name) from user where name=#{name}")
    int checkName(String name);


//    @Select("SELECT uuid,name,password,email,gender,birth from user where name=#{name}")
    User findUserByName(String name);

//    @Select("SELECT uuid,name,password,email,gender,birth from user where uuid=#{uuid}")
    User findUserByUuid(String uuid);

}
